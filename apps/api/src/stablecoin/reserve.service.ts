import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MintStatus, RedemptionStatus } from '@paychain/database';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { stableStringify } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { AuthContext } from '../auth/auth-context';
import { addAmounts, assertValidAmount, compareAmounts, mulAmountsCeil, subAmounts, sumAmounts, toScaled } from '../common/money';

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
  reserveRatio: string; // reserveBalance / backingLiability (or "N/A" when supply is 0)
  targetRatio: string;
  shortfall: boolean;
  /** Value of one coin in the reference currency (denomination). "1" = 1 coin is 1 currency unit. */
  unitValue: string;
  /** The reference-currency claim the reserve must cover = outstandingSupply × unitValue. */
  backingLiability: string;
  /**
   * Tokens issued and not burned — the claims the reserve must answer today. Equal to
   * outstandingSupply by construction, and named separately because §23 asks for the
   * LIABILITY view: supply is what exists, unredeemed liability is what we owe against it.
   */
  unredeemedLiability: string;
  /** Mints not yet on chain that will become supply unless they fail. */
  pendingMintLiability: string;
  /** Redemptions where fiat is committed or owed and the tokens are not yet burned. */
  pendingRedemptionLiability: string;
}

/**
 * Mint states that have not landed on chain but are still going to, absent a failure.
 * Excludes CONFIRMED/RECONCILED (already counted in supply) and REJECTED/FAILED (never will be).
 */
const PENDING_MINT_STATUSES: MintStatus[] = [
  'REQUESTED',
  'RESERVE_PENDING',
  'RESERVE_CONFIRMED',
  'COMPLIANCE_REVIEW',
  'APPROVAL_REQUIRED',
  'APPROVED',
  'SIGNING',
  'SUBMITTED',
];

/**
 * Redemption states where PayChain owes fiat, or has paid it, but the tokens still exist.
 *
 * Starts at ESCROW_HELD, not REQUESTED: before escrow nothing is committed and the request can
 * be refused for free. Ends at BURN_PENDING — once BURN_CONFIRMED the tokens are gone and the
 * obligation is discharged.
 */
const PENDING_REDEMPTION_STATUSES: RedemptionStatus[] = [
  'ESCROW_HELD',
  'FIAT_PAYOUT_PENDING',
  'FIAT_PAYOUT_CONFIRMED',
  'BURN_PENDING',
];

/**
 * Reserve management (§23). Tracks reserve accounts (references only — never banking
 * credentials), computes outstanding supply from confirmed mints minus burns, and flags a
 * shortfall when the reserve ratio drops below the configured target.
 *
 * §23: "Do not mint on stale or unreconciled reserve data." This docstring previously CLAIMED
 * the mint saga checked this. It did not — there was no concept of staleness anywhere, takenAt
 * was written and never read, and STALE_RESERVE_DATA was declared and never produced. A comment
 * asserting a control that does not exist is worse than a silent gap: it stops the next reader
 * from looking. assertFresh() is that check, and stepMint calls it.
 */
@Injectable()
export class ReserveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(CONFIG) cfg: PayChainConfig,
    private readonly flags: FeatureFlagsService,
  ) {
    this.maxStalenessHours = cfg.RESERVE_MAX_STALENESS_HOURS;
  }

  /**
   * The reserve figure the ratio is decided against. Normally the internal ACTIVE-account sum; when
   * `stablecoin.trustee_reserve.authoritative` is on for the tenant, the trustee's attested figure
   * (newest fresh source='trustee' snapshot) is authoritative instead — fail-closed to '0' (a
   * breach) when no fresh trustee snapshot exists, so minting cannot proceed on uncorroborated books.
   */
  private async authoritativeReserveBalance(
    tenantId: string,
    assetId: string,
    internalSum: string,
  ): Promise<string> {
    if (!(await this.flags.isEnabled('stablecoin.trustee_reserve.authoritative', tenantId))) {
      return internalSum;
    }
    const cutoff = new Date(Date.now() - this.maxStalenessHours * 3_600_000);
    const latest = await this.prisma.reserveSnapshot.findFirst({
      where: { tenantId, assetId, source: 'trustee', takenAt: { gte: cutoff } },
      orderBy: { takenAt: 'desc' },
      select: { reserveBalance: true },
    });
    return latest?.reserveBalance ?? '0';
  }

  private readonly maxStalenessHours: number;

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

  async listMovements(tenantId: string) {
    return this.prisma.reserveMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
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

  /** Value of one coin in the reference currency (denomination). Default "1" = 1 coin per unit. */
  async unitValueFor(tenantId: string, assetId: string): Promise<string> {
    const config = await this.prisma.stablecoinConfig.findFirst({
      where: { tenantId, assetId },
      select: { unitValue: true },
    });
    return config?.unitValue ?? '1';
  }

  /**
   * §23: refuse to mint against a reserve figure nobody has corroborated recently.
   *
   * A reserve balance is an assertion, not an observation — there is no custodian feed behind it.
   * Its only corroboration is an operator taking a snapshot, so the newest snapshot's age IS the
   * freshness of the figure. Beyond maxStalenessHours we do not know what backs the tokens, and
   * §23's instruction is not to mint in that state.
   *
   * No snapshot at all is treated as stale, not as fine: an unverified reserve and an unverifiable
   * one are the same thing to a token holder.
   */
  async assertFresh(tenantId: string, assetId: string): Promise<void> {
    const latest = await this.prisma.reserveSnapshot.findFirst({
      where: { tenantId, assetId },
      orderBy: { takenAt: 'desc' },
      select: { takenAt: true },
    });

    if (!latest) {
      throw new BadRequestException(
        `Refusing to mint: reserve for asset ${assetId} has never been snapshotted, so its ` +
          `balance is unverified. Take a reserve snapshot first (§23).`,
      );
    }

    const ageHours = (Date.now() - latest.takenAt.getTime()) / 3_600_000;
    if (ageHours > this.maxStalenessHours) {
      throw new BadRequestException(
        `Refusing to mint: reserve data is stale — last verified ${ageHours.toFixed(1)}h ago, ` +
          `limit is ${this.maxStalenessHours}h (§23).`,
      );
    }
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
    // Backing needed after this mint, in the reference currency: projected supply × unitValue.
    const projectedLiability = mulAmountsCeil(projectedSupply, state.unitValue);
    const hasSupply = compareAmounts(projectedSupply, '0') > 0;
    return {
      // The comparison itself is exact — see meetsRatio. Only the DISPLAY ratio is fractional.
      breach: hasSupply && !meetsRatio(state.reserveBalance, projectedLiability, targetRatio),
      projectedRatio: hasSupply ? displayRatio(state.reserveBalance, projectedLiability) : 'N/A',
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
    const reserveBalance = await this.authoritativeReserveBalance(
      tenantId,
      assetId,
      sumAmounts(accounts.map((a) => a.balance)),
    );
    const unitValue = await this.unitValueFor(tenantId, assetId);

    const [minted, redeemed, spent, exchangedOut, pendingMints, pendingRedemptions] = await Promise.all([
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
      // Spend-for-goods burns also remove supply — same rule, same off-chain test. A spend only
      // counts once its burn is CONFIRMED (BURN_CONFIRMED/COMPLETED); a submitted-but-unconfirmed
      // spend (BURN_PENDING) still has circulating tokens and must not shrink the liability early.
      // Omitting this term would leave burned points counted as backed supply — an over-statement
      // of what the reserve owes, i.e. silent under-collateralization.
      this.prisma.stablecoinSpend.findMany({
        where: { tenantId, assetId, status: { in: ['BURN_CONFIRMED', 'COMPLETED'] } },
        select: { amount: true },
      }),
      // Cross-peg exchange burns the SOURCE coin — same rule. Counts once the source burn is
      // confirmed (SOURCE_BURNED) through to COMPLETED. Excludes SOURCE_BURN_PENDING (still
      // circulating) and COMPENSATING/COMPENSATED (the source coins were re-issued, so they exist
      // again and must be counted as supply). Keyed on fromAssetId — this asset is the source.
      this.prisma.stablecoinExchange.findMany({
        where: { tenantId, fromAssetId: assetId, status: { in: ['SOURCE_BURNED', 'DEST_MINT_PENDING', 'COMPLETED'] } },
        select: { fromAmount: true },
      }),
      // §23 liabilities. These columns existed on ReserveSnapshot from the start and nothing
      // ever wrote them — they were declared, exposed in API responses, and always null. A
      // column that names a calculation nobody performs is the same failure as a status that
      // names a control nobody implements.
      this.prisma.stablecoinMintRequest.findMany({
        where: { tenantId, assetId, status: { in: PENDING_MINT_STATUSES } },
        select: { amount: true },
      }),
      this.prisma.stablecoinRedemption.findMany({
        where: { tenantId, assetId, status: { in: PENDING_REDEMPTION_STATUSES } },
        select: { amount: true },
      }),
    ]);
    // Exact fixed-point supply; the ratio is an inherently-fractional DISPLAY value, but the
    // shortfall DECISION is made exactly — a float comparison here decides whether tokens are
    // backed, which is not a place for rounding.
    // supply = confirmed mints − every confirmed burn (redemption cash-out, spend-for-goods, and
    // cross-peg exchange of this coin as the SOURCE). Each removes tokens from circulation, so each
    // subtracts from the liability the reserve covers.
    const burned = sumAmounts([
      sumAmounts(redeemed.map((r) => r.amount)),
      sumAmounts(spent.map((s) => s.amount)),
      sumAmounts(exchangedOut.map((x) => x.fromAmount)),
    ]);
    const outstandingSupply = subAmounts(sumAmounts(minted.map((m) => m.amount)), burned);
    // The claim the reserve must answer, in the reference currency: supply × unitValue. With the
    // default unitValue "1" this equals supply, so every existing coin's math is unchanged.
    const backingLiability = mulAmountsCeil(outstandingSupply, unitValue);
    const hasSupply = compareAmounts(outstandingSupply, '0') > 0;
    return {
      assetId,
      reserveBalance,
      outstandingSupply,
      reserveRatio: hasSupply ? displayRatio(reserveBalance, backingLiability) : 'N/A',
      targetRatio,
      shortfall: hasSupply && !meetsRatio(reserveBalance, backingLiability, targetRatio),
      unitValue,
      backingLiability,
      // Equal to outstandingSupply, deliberately: every unburned token is a claim. Kept as a
      // named field because §23 asks for the liability view, and because if the two ever stop
      // being equal that is a fact worth seeing rather than hiding behind one number.
      unredeemedLiability: outstandingSupply,
      pendingMintLiability: sumAmounts(pendingMints.map((m) => m.amount)),
      pendingRedemptionLiability: sumAmounts(pendingRedemptions.map((r) => r.amount)),
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
          // In the hash, not merely beside it. A hash that seals the balance but leaves the
          // liabilities loose lets someone restate what we owe without breaking the seal, while
          // the snapshot still looks committed.
          unredeemedLiability: state.unredeemedLiability,
          pendingMintLiability: state.pendingMintLiability,
          pendingRedemptionLiability: state.pendingRedemptionLiability,
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
        unredeemedLiability: state.unredeemedLiability,
        pendingMintLiability: state.pendingMintLiability,
        pendingRedemptionLiability: state.pendingRedemptionLiability,
        snapshotHash,
        source: opts.source ?? 'manual',
        takenAt,
      },
    });
  }

  /**
   * Records a reserve snapshot corroborated by the external trustee (§23/§24). Unlike snapshot(),
   * the reserve balance is the trustee's ATTESTED figure (real bank money the trustee verified),
   * not our internal ledger sum — the whole point of trustee reserve control. Liabilities and the
   * ratio are computed against current outstanding supply. Written as a normal ReserveSnapshot with
   * source='trustee', so a fresh one satisfies assertFresh() and corroborates minting. The Ed25519
   * signature has already been verified by the receiver against the trustee's reserve_snapshot key;
   * it is stored as evidence, never trusted blind here.
   */
  async recordTrusteeSnapshot(
    tenantId: string,
    assetId: string,
    input: { reserveBalance: string; trusteeSnapshotId: string; keyId: string; signature: string },
  ) {
    const targetRatio = await this.targetRatioFor(tenantId, assetId);
    const state = await this.getState(tenantId, assetId, targetRatio);
    const reserveRatio =
      compareAmounts(state.outstandingSupply, '0') > 0
        ? displayRatio(input.reserveBalance, state.backingLiability)
        : 'N/A';
    return this.prisma.reserveSnapshot.create({
      data: {
        tenantId,
        assetId,
        reserveBalance: input.reserveBalance,
        outstandingSupply: state.outstandingSupply,
        reserveRatio,
        unredeemedLiability: state.unredeemedLiability,
        pendingMintLiability: state.pendingMintLiability,
        pendingRedemptionLiability: state.pendingRedemptionLiability,
        source: 'trustee',
        trusteeSnapshotId: input.trusteeSnapshotId,
        trusteeKeyId: input.keyId,
        trusteeSignature: input.signature,
        takenAt: new Date(),
      },
    });
  }
}
