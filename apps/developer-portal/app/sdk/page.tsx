const INSTALL_SNIPPET = `# From a GitHub release tarball (works today, no registry account needed):
npm install https://github.com/khengleng/PayChain/releases/download/sdk-v0.1.0/paychain-sdk-0.1.0.tgz

# Or build it from source and install the tarball locally:
git clone https://github.com/khengleng/PayChain && cd PayChain
pnpm install && pnpm --filter @paychain/sdk build
cd packages/sdk-typescript && npm pack        # -> paychain-sdk-0.1.0.tgz
npm install /path/to/paychain-sdk-0.1.0.tgz   # from your app`;

const SDK_SNIPPET = `import { PayChainClient } from '@paychain/sdk';

const client = new PayChainClient({
  baseUrl: process.env.PAYCHAIN_URL!,        // https://api.paychain.cambobia.com/api/v1
  clientId: process.env.PAYCHAIN_CLIENT_ID!,
  clientSecret: process.env.PAYCHAIN_CLIENT_SECRET!,
});

// token caching, auto Idempotency-Key, retries + correlation ids are handled for you
const wallet = await client.wallets.create({ ownerType: 'CUSTOMER', ownerReference: 'alice' });
const asset  = await client.assets.create({ assetCode: 'PTS', assetName: 'Loyalty Points' });
await client.assets.activate(asset.id);
await client.assets.issue(asset.id, { destinationWalletId: wallet.id, amount: '100' });
const balance = await client.wallets.balances(wallet.id);`;

const PAYKH_SNIPPET = `// Copy this pattern into your own codebase — see examples/paykh-adapter in the repo.
// The key discipline is the idempotency key: derive it from YOUR event id, never a random value.

const wallet = await client.wallets.create(
  { ownerType: 'CUSTOMER', ownerReference: \`paykh:\${customerId}\` },
  \`paykh:wallet:\${customerId}\`,          // same customer -> same wallet, forever
);

await client.assets.earn(
  loyaltyAssetId,
  { walletId, spendAmount: '5', currency: 'USD', merchantId },
  \`paykh:earn:\${eventId}\`,               // same purchase -> awarded once, even on retry
);`;

export default function Sdk() {
  return (
    <div className="wrap">
      <h1>TypeScript SDK</h1>
      <p className="lead">
        <span className="mono">@paychain/sdk</span> — OAuth2 token caching, automatic
        Idempotency-Key on writes, transient-retry with backoff, typed errors, and webhook
        verification. No runtime dependencies.
      </p>

      <h2>Install</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        <strong>Not on the public npm registry yet.</strong> <span className="mono">npm install
        @paychain/sdk</span> will 404 — use a tarball until it is published.
      </p>
      <pre>
        <code>{INSTALL_SNIPPET}</code>
      </pre>

      <h2>Usage</h2>
      <pre>
        <code>{SDK_SNIPPET}</code>
      </pre>

      <h2>PayKH integration pattern (loyalty-only)</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        <span className="mono">examples/paykh-adapter</span> is a reference implementation inside
        the PayChain repo — it is <strong>not a published package</strong> and cannot be installed.
        Read it, then copy the pattern into your own service.
      </p>
      <pre>
        <code>{PAYKH_SNIPPET}</code>
      </pre>
      <p className="lead" style={{ fontSize: 14 }}>
        Full steps, migration sequence and rollback: see <a href="/integration">Integration guide</a>.
      </p>
    </div>
  );
}
