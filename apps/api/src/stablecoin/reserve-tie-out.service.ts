import { Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { compareAmounts, sumAmounts } from '../common/money';
import { ReserveService, displayRatio, meetsRatio } from './reserve.service';

export type TieOutStatus = 'RECONCILED' | 'SHORTFALL' | 'MISMATCH' | 'UNATTESTED';

export interface ReserveTieOut {
  assetId: string;
  /** PayChain's internal ledger reserve (sum of ACTIVE reserve accounts, in the peg currency). */
  ledgerReserve: string;
  /** What we owe on chain, in the peg currency: outstanding supply × unit value. */
  onChainLiability: string;
  outstandingSupply: string;
  unitValue: string;
  targetRatio: string;
  /** The trustee's freshest ATTESTED fiat reserve (null when none is fresh). */
  trusteeAttestedFiat: string | null;
  trusteeAttestedAt: string | null;
  /** ledger ≥ liability × target. */
  ledgerCoversLiability: boolean;
  /** trustee fiat ≥ liability × target (false when unattested). */
  trusteeCoversLiability: boolean;
  /** ledger reserve == trustee-attested fiat (exact). */
  ledgerMatchesTrustee: boolean;
  ledgerRatio: string;
  discrepancies: string[];
  status: TieOutStatus;
}

/**
 * Three-way reserve tie-out (§23/§31): the check PayKH named as the real stablecoin gap.
 *
 * Reconciles the three figures that must agree for a coin to be genuinely backed:
 *   1. PayChain's internal LEDGER reserve  (sum of ACTIVE reserve accounts)
 *   2. the ON-CHAIN liability              (outstanding supply × unit value, from getState)
 *   3. the TRUSTEE-attested fiat           (the freshest fresh trustee reserve snapshot)
 *
 * "Stellar records the asset, the trustee confirms the money, PayChain coordinates both" — this is
 * where all three are compared in one place. It is read-only and computed (like GET /reserve): it
 * asserts nothing it cannot derive, and treats an absent/stale trustee attestation as UNATTESTED
 * rather than passing silently.
 */
@Injectable()
export class ReserveTieOutService {
  private readonly maxStalenessHours: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly reserve: ReserveService,
    @Inject(CONFIG) cfg: PayChainConfig,
  ) {
    this.maxStalenessHours = cfg.RESERVE_MAX_STALENESS_HOURS;
  }

  async tieOut(tenantId: string, assetId: string): Promise<ReserveTieOut> {
    const state = await this.reserve.getStateForAsset(tenantId, assetId);

    // Leg 1 — internal ledger reserve. Queried directly (NOT state.reserveBalance, which the
    // trustee-authoritative flag may replace): the whole point is to compare the two independently.
    const accounts = await this.prisma.reserveAccount.findMany({
      where: { tenantId, assetId, status: 'ACTIVE' },
      select: { balance: true },
    });
    const ledgerReserve = sumAmounts(accounts.map((a) => a.balance));

    // Leg 3 — trustee-attested fiat: the freshest trustee snapshot within the staleness window. A
    // stale or missing attestation is UNATTESTED, never treated as coverage.
    const cutoff = new Date(Date.now() - this.maxStalenessHours * 3_600_000);
    const snapshot = await this.prisma.reserveSnapshot.findFirst({
      where: { tenantId, assetId, source: 'trustee', takenAt: { gte: cutoff } },
      orderBy: { takenAt: 'desc' },
      select: { reserveBalance: true, takenAt: true },
    });
    const trusteeAttestedFiat = snapshot?.reserveBalance ?? null;

    const liability = state.backingLiability;
    const targetRatio = state.targetRatio;
    const hasSupply = compareAmounts(state.outstandingSupply, '0') > 0;

    // With zero supply there is nothing to back, so every leg trivially "covers".
    const ledgerCoversLiability = !hasSupply || meetsRatio(ledgerReserve, liability, targetRatio);
    const trusteeCoversLiability =
      trusteeAttestedFiat !== null && (!hasSupply || meetsRatio(trusteeAttestedFiat, liability, targetRatio));
    const ledgerMatchesTrustee =
      trusteeAttestedFiat !== null && compareAmounts(ledgerReserve, trusteeAttestedFiat) === 0;

    const discrepancies: string[] = [];
    if (!ledgerCoversLiability) discrepancies.push('LEDGER_SHORTFALL');
    if (trusteeAttestedFiat === null) discrepancies.push('NO_TRUSTEE_ATTESTATION');
    else {
      if (!trusteeCoversLiability) discrepancies.push('TRUSTEE_SHORTFALL');
      if (!ledgerMatchesTrustee) discrepancies.push('LEDGER_TRUSTEE_MISMATCH');
    }

    const status: TieOutStatus =
      discrepancies.length === 0
        ? 'RECONCILED'
        : discrepancies.includes('LEDGER_SHORTFALL') || discrepancies.includes('TRUSTEE_SHORTFALL')
          ? 'SHORTFALL'
          : discrepancies.includes('LEDGER_TRUSTEE_MISMATCH')
            ? 'MISMATCH'
            : 'UNATTESTED';

    return {
      assetId,
      ledgerReserve,
      onChainLiability: liability,
      outstandingSupply: state.outstandingSupply,
      unitValue: state.unitValue,
      targetRatio,
      trusteeAttestedFiat,
      trusteeAttestedAt: snapshot?.takenAt?.toISOString() ?? null,
      ledgerCoversLiability,
      trusteeCoversLiability,
      ledgerMatchesTrustee,
      ledgerRatio: hasSupply ? displayRatio(ledgerReserve, liability) : 'N/A',
      discrepancies,
      status,
    };
  }
}
