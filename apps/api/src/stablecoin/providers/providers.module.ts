import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';
import { TrusteeApiClient } from './trustee-api-client.service';
import { TrusteeReserveFundingProvider } from './trustee-reserve-funding.provider';

/**
 * External-integration ports for the stablecoin workflows (§5, §23, §25). M4 binds mock
 * implementations (mock + testnet only). Real banks/custodians/payment processors integrate
 * behind these tokens later. No online banking credentials are ever stored (§23).
 */
export const RESERVE_FUNDING_PROVIDER = Symbol('RESERVE_FUNDING_PROVIDER');
export const FIAT_PAYOUT_PROVIDER = Symbol('FIAT_PAYOUT_PROVIDER');

export interface ReserveFundingProvider {
  /** Confirms that funds backing a mint have actually landed in reserve. */
  confirmFunding(input: {
    tenantId: string;
    reference: string;
    expectedAmount: string;
  }): Promise<{ confirmed: boolean; amount?: string }>;
}

export type PayoutStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface FiatPayoutProvider {
  initiatePayout(input: {
    tenantId: string;
    amount: string;
    bankAccountReference: string;
    correlationId: string;
  }): Promise<{ payoutReference: string; status: PayoutStatus }>;
  getPayoutStatus(payoutReference: string): Promise<PayoutStatus>;
}

/** Mock funding: a reference prefixed "FUND-" is treated as confirmed reserve funding. */
export class MockReserveFundingProvider implements ReserveFundingProvider {
  async confirmFunding(input: { reference: string; expectedAmount: string }) {
    const confirmed = typeof input.reference === 'string' && input.reference.startsWith('FUND-');
    return { confirmed, amount: confirmed ? input.expectedAmount : undefined };
  }
}

/** Mock fiat payout: initiates PENDING, then reports CONFIRMED on status polling. */
export class MockFiatPayoutProvider implements FiatPayoutProvider {
  async initiatePayout(input: { amount: string; bankAccountReference: string }) {
    return { payoutReference: `PAYOUT-${input.bankAccountReference}-${input.amount}`, status: 'PENDING' as PayoutStatus };
  }
  async getPayoutStatus(_payoutReference: string) {
    return 'CONFIRMED' as PayoutStatus;
  }
}

@Global()
@Module({
  providers: [
    TrusteeApiClient,
    // Trustee-verified funding when the tenant is under trustee control; FUND- mock otherwise.
    {
      provide: RESERVE_FUNDING_PROVIDER,
      inject: [PrismaService, FeatureFlagsService],
      useFactory: (prisma: PrismaService, flags: FeatureFlagsService) =>
        new TrusteeReserveFundingProvider(prisma, flags),
    },
    { provide: FIAT_PAYOUT_PROVIDER, useFactory: () => new MockFiatPayoutProvider() },
  ],
  exports: [RESERVE_FUNDING_PROVIDER, FIAT_PAYOUT_PROVIDER, TrusteeApiClient],
})
export class StablecoinProvidersModule {}
