import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import { addAmounts, subAmounts, sumAmounts } from '../common/money';

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

  /** Records an approved reserve credit/debit and updates the running balance. */
  async recordMovement(
    auth: AuthContext,
    input: { reserveAccountId: string; direction: 'CREDIT' | 'DEBIT'; amount: string; reference?: string; approvedBy?: string },
    correlationId: string,
  ) {
    const account = await this.prisma.reserveAccount.findUnique({ where: { id: input.reserveAccountId } });
    if (!account || account.tenantId !== auth.tenantId) throw new NotFoundException('Reserve account not found');

    // Fixed-point arithmetic on money (§47) — never float the authoritative balance.
    const next = input.direction === 'CREDIT'
      ? addAmounts(account.balance, input.amount)
      : subAmounts(account.balance, input.amount);

    const [, movement] = await this.prisma.$transaction([
      this.prisma.reserveAccount.update({ where: { id: account.id }, data: { balance: next } }),
      this.prisma.reserveMovement.create({
        data: {
          tenantId: auth.tenantId,
          reserveAccountId: account.id,
          direction: input.direction,
          amount: input.amount,
          reference: input.reference,
          createdBy: auth.clientId,
          approvedBy: input.approvedBy,
        },
      }),
    ]);
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'reserve.movement',
      resourceType: 'reserve_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { direction: input.direction, amount: input.amount, balance: next },
    });
    return movement;
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
    // Exact fixed-point supply; ratio is an inherently-fractional display value.
    const outstandingSupply = subAmounts(sumAmounts(minted.map((m) => m.amount)), sumAmounts(redeemed.map((r) => r.amount)));
    const supplyNum = Number(outstandingSupply);
    const ratio = supplyNum > 0 ? Number(reserveBalance) / supplyNum : Number.POSITIVE_INFINITY;
    return {
      assetId,
      reserveBalance,
      outstandingSupply,
      reserveRatio: supplyNum > 0 ? ratio.toFixed(6) : 'N/A',
      targetRatio,
      shortfall: supplyNum > 0 && ratio < Number(targetRatio),
    };
  }

  async snapshot(tenantId: string, assetId: string, targetRatio = '1.0') {
    const state = await this.getState(tenantId, assetId, targetRatio);
    return this.prisma.reserveSnapshot.create({
      data: {
        tenantId,
        assetId,
        reserveBalance: state.reserveBalance,
        outstandingSupply: state.outstandingSupply,
        reserveRatio: state.reserveRatio === 'N/A' ? '0' : state.reserveRatio,
        source: 'manual',
      },
    });
  }
}
