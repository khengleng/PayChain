import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';
import { compareAmounts } from '../../common/money';
import type { ReserveFundingProvider } from './providers.module';

/**
 * Confirms a mint's funding from a trustee-verified CLEARED deposit (real bank money the trustee
 * safeguarded), matched by the deposit's `reference` == the mint's fundingReference.
 *
 * Flag-gated: only when `stablecoin.trustee_authorization.required` is on for the tenant does the
 * mint require a trustee deposit. When off, it falls back to the previous `FUND-` mock behaviour so
 * dev/testnet flows and existing tests are unchanged.
 */
@Injectable()
export class TrusteeReserveFundingProvider implements ReserveFundingProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  async confirmFunding(input: { tenantId: string; reference: string; expectedAmount: string }) {
    const trusteeRequired = await this.flags.isEnabled(
      'stablecoin.trustee_authorization.required',
      input.tenantId,
    );
    if (trusteeRequired) {
      if (!input.reference) return { confirmed: false };
      const deposit = await this.prisma.trusteeDeposit.findFirst({
        where: { tenantId: input.tenantId, reference: input.reference, status: 'CLEARED' },
      });
      if (deposit && compareAmounts(deposit.amount, input.expectedAmount) >= 0) {
        return { confirmed: true, amount: deposit.amount };
      }
      return { confirmed: false };
    }
    // Fallback (dev/testnet): the FUND- mock behaviour, unchanged.
    const confirmed = typeof input.reference === 'string' && input.reference.startsWith('FUND-');
    return { confirmed, amount: confirmed ? input.expectedAmount : undefined };
  }
}
