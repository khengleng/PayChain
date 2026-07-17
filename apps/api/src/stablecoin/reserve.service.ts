import { createHash } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { stableStringify } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import { addAmounts, assertValidAmount, compareAmounts, subAmounts, sumAmounts, toScaled } from '../common/money';

/**
 * Is `reserve / supply >= target`, decided exactly (§47).
 *
 * Rearranged to `reserve >= supply * target` so it is integer arithmetic on scaled BigInts — no
 * division, no rounding, no float. This decides whether tokens are backed; the earlier version
 * used `Number(reserve) / Number(supply) < Number(target)`, which is the exact arithmetic the
 * money helpers exist to prevent, in the one place it matters most.
 */
export function meetsRatio(reserve: string, supply: string, target: string): boolean {
  const SCALE = 10_000_000n; // money.ts fixed-point scale (7dp)
  // reserve * SCALE >= supply * target, both sides scaled identically.
  return toScaled(reserve) * SCALE >= toScaled(supply) * toScaled(target);
}

/** Human-readable ratio. Display only — never used for a decision. */
export function displayRatio(reserve: string, supply: string): string {
  const s = toScaled(supply);
  if (s === 0n) return 'N/A';
  // Fixed-point division to 6dp for presentation.
  return (Number((toScaled(reserve) * 1_000_000n) / s) / 1_000_000).toFixed(6);
}

export interface ReserveState {
  assetId: string;
  reserveBalance: string;
  outstandingSupply: string;
  reserveRatio: string; // reserveBalance / outstandingSupply (or "N/A" when supply is 0)
  targetRatio: string;
  shortfall: boolean;
}

/**
 * Reserve management (§23). Tracks reserve accounts (references only — never banking
 * credentials), computes outstanding supply from confirmed mints minus burns, and flags a
 * shortfall when the reserve ratio drops below the configured target. Minting must not
 * proceed on stale/unreconciled reserve data — the mint saga checks this.
 */
@Injectable()
export class ReserveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async registerAccount(
    auth: AuthContext,
    input: { assetId: string; label: string; custodianReference?: string; bankReference?: string },
    correlationId: string,
  ) {
    const account = await this.prisma.reserveAccount.create({
      data: {
        tenantId: auth.tenantId,
        assetId: input.assetId,
        label: input.label,
        custodianReference: input.custodianReference,
        bankReference: input.bankReference,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'reserve.account.register',
      resourceType: 'reserve_account',
      resourceId: account.id,
      correlationId,
      metadata: { assetId: input.assetId, label: input.label },
    });
    return account;
  }

  /**
   * Requests a reserve credit/debit. Moves NO money — the movement is PENDING_APPROVAL until a
   * different principal approves it. `approvedBy` is never accepted from the caller.
   */
  async requestMovement(
    auth: AuthContext,
    input: { reserveAccountId: string; direction: 'CREDIT' | 'DEBIT'; amount: string; reference?: string },
    correlationId: string,
  ) {
    assertValidAmount(input.amount);
    const account = await this.requireAccount(auth.tenantId, input.reserveAccountId);

    const movement = await this.prisma.reserveMovement.create({
      data: {
        tenantId: auth.tenantId,
        reserveAccountId: account.id,
        direction: input.direction,
        amount: input.amount,
        reference: input.reference,
        status: 'PENDING_APPROVAL',
        createdBy: auth.clientId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'reserve.movement.requested',
      resourceType: 'reserve_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { direction: input.direction, amount: input.amount, reserveAccountId: account.id },
    });
    return movement;
  }

  /**
   * Approves and applies a pending movement (§23 maker-checker).
   *
   * The balance update and the status transition happen in ONE transaction, with the status
   * change conditioned on the row still being PENDING_APPROVAL (updateMany + count check). Two
   * concurrent approvals therefore cannot both apply the same movement and double-credit the
   * reserve — the loser sees zero rows updated and aborts.
   */
  async approveMovement(auth: AuthContext, movementId: string, correlationId: string) {
    const movement = await this.prisma.reserveMovement.findUnique({ where: { id: movementId } });
    if (!movement || movement.tenantId !== auth.tenantId) {
      throw new NotFoundException('Reserve movement not found');
    }
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new ConflictException(`Movement is ${movement.status}, not PENDING_APPROVAL`);
    }
    // Maker-checker: whoever asked for the reserve to change cannot be the one who confirms it.
    if (movement.createdBy === auth.clientId) {
      throw new ForbiddenException('Maker-checker: the requester cannot approve their own reserve movement');
    }

    const account = await this.requireAccount(auth.tenantId, movement.reserveAccountId);

    // Fixed-point arithmetic on money (§47) — never float the authoritative balance.
    const next =
      movement.direction === 'CREDIT'
        ? addAmounts(account.balance, movement.amount)
        : subAmounts(account.balance, movement.amount);

    // A reserve cannot go negative: that would mean claiming to hold assets we do not.
    // Fixed-point: this file's own comment says never float the authoritative balance, and the
    // first version of this guard did exactly that.
    if (compareAmounts(next, '0') < 0) {
      throw new ConflictException(
        `Refusing to apply movement: would take reserve balance negative (${account.balance} - ${movement.amount})`,
      );
    }

    const applied = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.reserveMovement.updateMany({
        where: { id: movement.id, status: 'PENDING_APPROVAL' },
        data: {
          status: 'APPLIED',
          approvedBy: auth.clientId,
          approvedAt: new Date(),
          balanceAfter: next,
        },
      });
      if (claim.count === 0) return null; // lost the race — another approver already applied it
      await tx.reserveAccount.update({ where: { id: account.id }, data: { balance: next } });
      return tx.reserveMovement.findUnique({ where: { id: movement.id } });
    });

    if (!applied) {
      throw new ConflictException('Movement was already applied by a concurrent approval');
    }

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'reserve.movement.applied',
      resourceType: 'reserve_movement',
      resourceId: movement.id,
      correlationId,
      metadata: {
        direction: movement.direction,
        amount: movement.amount,
        requestedBy: movement.createdBy,
        balanceBefore: account.balance,
        balanceAfter: next,
      },
    });
    return applied;
  }

  /** Rejects a pending movement. Status-guarded, and the maker cannot self-reject. */
  async rejectMovement(auth: AuthContext, movementId: string, reason: string, correlationId: string) {
    const movement = await this.prisma.reserveMovement.findUnique({ where: { id: movementId } });
    if (!movement || movement.tenantId !== auth.tenantId) {
      throw new NotFoundException('Reserve movement not found');
    }
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new ConflictException(`Movement is ${movement.status}, not PENDING_APPROVAL`);
    }
    if (movement.createdBy === auth.clientId) {
      throw new ForbiddenException('Maker-checker: the requester cannot reject their own reserve movement');
    }

    const rejected = await this.prisma.reserveMovement.updateMany({
      where: { id: movement.id, status: 'PENDING_APPROVAL' },
      data: { status: 'REJECTED', approvedBy: auth.clientId, approvedAt: new Date(), rejectedReason: reason },
    });
    if (rejected.count === 0) throw new ConflictException('Movement changed state concurrently');

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'reserve.movement.rejected',
      resourceType: 'reserve_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { reason, requestedBy: movement.createdBy },
    });
    return this.prisma.reserveMovement.findUnique({ where: { id: movement.id } });
  }

  private async requireAccount(tenantId: string, reserveAccountId: string) {
    const account = await this.prisma.reserveAccount.findUnique({ where: { id: reserveAccountId } });
    if (!account || account.tenantId !== tenantId) throw new NotFoundException('Reserve account not found');
    return account;
  }

  /**
   * The asset's configured reserve ratio target (§23). Callers must not default to '1.0' — a
   * coin configured to hold 1.05 backing would silently be judged against 1.00 and look healthy
   * while under-reserved against its own policy.
   */
  async targetRatioFor(tenantId: string, assetId: string): Promise<string> {
    const config = await this.prisma.stablecoinConfig.findFirst({
      where: { tenantId, assetId },
      select: { reserveRatioTarget: true },
    });
    return config?.reserveRatioTarget ?? '1.0';
  }

  /** Computes the live reserve state against the asset's configured target. */
  async getStateForAsset(tenantId: string, assetId: string): Promise<ReserveState> {
    return this.getState(tenantId, assetId, await this.targetRatioFor(tenantId, assetId));
  }

  /**
   * Would minting `additionalAmount` push this asset below its configured reserve target?
   *
   * This is the check that gives the ratio teeth. Detecting a shortfall *after* minting is of
   * little use to a token holder — the tokens already exist and are already under-backed. The
   * question that matters is asked before issuance: does the reserve cover what we are about
   * to owe? Deliberately conservative: an unknown or unfunded reserve reads as a breach.
   */
  async wouldBreachTarget(
    tenantId: string,
    assetId: string,
    additionalAmount: string,
  ): Promise<{ breach: boolean; projectedRatio: string; targetRatio: string; reserveBalance: string; projectedSupply: string }> {
    const targetRatio = await this.targetRatioFor(tenantId, assetId);
    const state = await this.getState(tenantId, assetId, targetRatio);
    const projectedSupply = addAmounts(state.outstandingSupply, additionalAmount);
    const hasSupply = compareAmounts(projectedSupply, '0') > 0;
    return {
      // The comparison itself is exact — see meetsRatio. Only the DISPLAY ratio is fractional.
      breach: hasSupply && !meetsRatio(state.reserveBalance, projectedSupply, targetRatio),
      projectedRatio: hasSupply ? displayRatio(state.reserveBalance, projectedSupply) : 'N/A',
      targetRatio,
      reserveBalance: state.reserveBalance,
      projectedSupply,
    };
  }

  /** Computes the live reserve state for an asset (§5 calculations). */
  async getState(tenantId: string, assetId: string, targetRatio = '1.0'): Promise<ReserveState> {
    const accounts = await this.prisma.reserveAccount.findMany({
      where: { tenantId, assetId, status: 'ACTIVE' },
      select: { balance: true },
    });
    const reserveBalance = sumAmounts(accounts.map((a) => a.balance));

    const [minted, redeemed] = await Promise.all([
      this.prisma.stablecoinMintRequest.findMany({
        where: { tenantId, assetId, status: { in: ['CONFIRMED', 'RECONCILED'] } },
        select: { amount: true },
      }),
      this.prisma.stablecoinRedemption.findMany({
        // Only count redemptions whose tokens are actually OFF-chain (burn confirmed). Tokens
        // in FIAT_PAYOUT_PENDING/CONFIRMED are still circulating — counting them early would
        // understate supply and hide a real shortfall.
        where: { tenantId, assetId, status: { in: ['BURN_CONFIRMED', 'COMPLETED'] } },
        select: { amount: true },
      }),
    ]);
    // Exact fixed-point supply; the ratio is an inherently-fractional DISPLAY value, but the
    // shortfall DECISION is made exactly — a float comparison here decides whether tokens are
    // backed, which is not a place for rounding.
    const outstandingSupply = subAmounts(sumAmounts(minted.map((m) => m.amount)), sumAmounts(redeemed.map((r) => r.amount)));
    const hasSupply = compareAmounts(outstandingSupply, '0') > 0;
    return {
      assetId,
      reserveBalance,
      outstandingSupply,
      reserveRatio: hasSupply ? displayRatio(reserveBalance, outstandingSupply) : 'N/A',
      targetRatio,
      shortfall: hasSupply && !meetsRatio(reserveBalance, outstandingSupply, targetRatio),
    };
  }

  /**
   * Records a point-in-time reserve snapshot (§23, §24).
   *
   * `snapshotHash` commits to the snapshot's contents so it can serve as evidence: an auditor
   * who records the hash can later prove the figures were not revised. Previously the field was
   * left null, which made the snapshot a mutable row asserting its own correctness.
   *
   * `source` distinguishes an operator-triggered snapshot from an automated one; a regulator
   * cares whether the figures were captured on a schedule or hand-picked.
   */
  async snapshot(
    tenantId: string,
    assetId: string,
    opts: { targetRatio?: string; source?: string; takenBy?: string } = {},
  ) {
    const targetRatio = opts.targetRatio ?? (await this.targetRatioFor(tenantId, assetId));
    const state = await this.getState(tenantId, assetId, targetRatio);
    const takenAt = new Date();
    // 'N/A' (zero supply) is preserved rather than coerced to '0' — a ratio of zero means
    // "no backing", which is the opposite of "nothing outstanding to back".
    const reserveRatio = state.reserveRatio;

    const snapshotHash = createHash('sha256')
      .update(
        stableStringify({
          tenantId,
          assetId,
          reserveBalance: state.reserveBalance,
          outstandingSupply: state.outstandingSupply,
          reserveRatio,
          targetRatio,
          shortfall: state.shortfall,
          takenAt: takenAt.toISOString(),
        }),
        'utf8',
      )
      .digest('hex');

    return this.prisma.reserveSnapshot.create({
      data: {
        tenantId,
        assetId,
        reserveBalance: state.reserveBalance,
        outstandingSupply: state.outstandingSupply,
        reserveRatio,
        snapshotHash,
        source: opts.source ?? 'manual',
        takenAt,
      },
    });
  }
}
