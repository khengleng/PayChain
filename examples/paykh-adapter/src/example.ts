/**
 * Runnable example (§29 developer portal, §44). Drives the loyalty flow against a PayChain
 * deployment using the adapter. Requires a seeded API client + an ACTIVE loyalty asset.
 *
 *   PAYCHAIN_URL=... PAYCHAIN_CLIENT_ID=... PAYCHAIN_CLIENT_SECRET=... \
 *   LOYALTY_ASSET_ID=... LOYALTY_ASSET_CODE=PTS \
 *   pnpm --filter @paychain/example-paykh-adapter example
 */
import { PayKhPayChainAdapter } from './adapter';
import {
  InMemoryPaymentRewardStateStore,
  PayKhPaymentRewardOrchestrator,
} from './payment-success';

async function main(): Promise<void> {
  const adapter = new PayKhPayChainAdapter({
    baseUrl: process.env.PAYCHAIN_URL ?? 'https://paychain-api-production-90f0.up.railway.app',
    clientId: process.env.PAYCHAIN_CLIENT_ID ?? 'demo-client',
    clientSecret: process.env.PAYCHAIN_CLIENT_SECRET ?? 'demo-secret',
    loyaltyAssetId: process.env.LOYALTY_ASSET_ID ?? '',
    loyaltyAssetCode: process.env.LOYALTY_ASSET_CODE ?? 'PTS',
  });
  const rewards = new PayKhPaymentRewardOrchestrator(adapter, new InMemoryPaymentRewardStateStore());

  const customerId = `demo-${process.env.CUSTOMER_SUFFIX ?? 'alice'}`;
  const reward = await rewards.handlePaymentSuccess({
    paymentId: `purchase-${customerId}-1`,
    customerId,
    spendAmount: '5',
    currency: 'USD',
  });
  console.log('reward request:', reward.record);

  const sweep = await rewards.reconcilePendingRewards();
  console.log('reconciliation sweep:', sweep);

  const balance = await adapter.getPointsBalance(reward.record.walletId);
  console.log('balance:', balance);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
