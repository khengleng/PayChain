import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';

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

    const next = input.direction === 'CREDIT'
      ? Number(account.balance) + Number(input.amount)
      : Number(account.balance) - Number(input.amount);

    const [, movement] = await this.prisma.$transaction([
      this.prisma.reserveAccount.update({ where: { id: account.id }, data: { balance: String(next) } }),
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
      metadata: { direction: input.direction, amount: input.amount, balance: String(next) },
    });
    return movement;
  }

  /** Computes the live reserve state for an asset (§5 calculations). */
  async getState(tenantId: string, assetId: string, targetRatio = '1.0'): Promise<ReserveState> {
    const accounts = await this.prisma.reserveAccount.findMany({
      where: { tenantId, assetId, status: 'ACTIVE' },
      select: { balance: true },
    });
    const reserveBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

    const [minted, redeemed] = await Promise.all([
      this.prisma.stablecoinMintRequest.findMany({
        where: { tenantId, assetId, status: { in: ['CONFIRMED', 'RECONCILED'] } },
        select: { amount: true },
      }),
      this.prisma.stablecoinRedemption.findMany({
        where: { tenantId, assetId, status: { in: ['BURN_CONFIRMED', 'FIAT_PAYOUT_PENDING', 'FIAT_PAYOUT_CONFIRMED', 'COMPLETED'] } },
        select: { amount: true },
      }),
    ]);
    const outstandingSupply =
      minted.reduce((s, m) => s + Number(m.amount), 0) - redeemed.reduce((s, r) => s + Number(r.amount), 0);

    const ratio = outstandingSupply > 0 ? reserveBalance / outstandingSupply : Number.POSITIVE_INFINITY;
    return {
      assetId,
      reserveBalance: String(reserveBalance),
      outstandingSupply: String(outstandingSupply),
      reserveRatio: outstandingSupply > 0 ? ratio.toFixed(6) : 'N/A',
      targetRatio,
      shortfall: outstandingSupply > 0 && ratio < Number(targetRatio),
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
