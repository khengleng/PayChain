const SDK_SNIPPET = `import { PayChainClient } from '@paychain/sdk';

const client = new PayChainClient({
  baseUrl: process.env.PAYCHAIN_URL!,
  clientId: process.env.PAYCHAIN_CLIENT_ID!,
  clientSecret: process.env.PAYCHAIN_CLIENT_SECRET!,
});

// token caching, auto Idempotency-Key, retries + correlation ids are handled for you
const wallet = await client.wallets.create({ ownerType: 'CUSTOMER', ownerReference: 'alice' });
const asset  = await client.assets.create({ assetCode: 'PTS', assetName: 'Loyalty Points' });
await client.assets.activate(asset.id);
await client.assets.issue(asset.id, { destinationWalletId: wallet.id, amount: '100' });
const balance = await client.wallets.balances(wallet.id);`;

const PAYKH_SNIPPET = `import { PayKhPayChainAdapter } from '@paychain/example-paykh-adapter';

const adapter = new PayKhPayChainAdapter({ baseUrl, clientId, clientSecret,
  loyaltyAssetId, loyaltyAssetCode: 'PTS' });

await adapter.ensureCustomerWallet(customerId);              // idempotent
await adapter.awardPurchaseReward({ eventId, walletId, spendAmount: '5', currency: 'USD' });
await adapter.awardReferralReward({ eventId, walletId, points: '20' });`;

export default function Sdk() {
  return (
    <div className="wrap">
      <h1>TypeScript SDK</h1>
      <p className="lead">
        <span className="mono">@paychain/sdk</span> — OAuth2 token caching, automatic
        Idempotency-Key on writes, transient-retry with backoff, typed errors, and webhook
        verification.
      </p>

      <h2>Usage</h2>
      <pre>
        <code>{SDK_SNIPPET}</code>
      </pre>

      <h2>PayKH adapter (loyalty-only)</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        A reference adapter (<span className="mono">examples/paykh-adapter</span>) shows the PayKH
        integration pattern — deterministic idempotency keys per business event, webhook handling,
        dual-run reconciliation, and stablecoin features kept disabled.
      </p>
      <pre>
        <code>{PAYKH_SNIPPET}</code>
      </pre>
    </div>
  );
}
