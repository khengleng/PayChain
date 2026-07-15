// Developer portal foundation (§29). Quickstart + SDK usage shell. Sandbox credential
// self-service, usage dashboards, and webhook testing are layered on in later work.

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

const TOKEN_SNIPPET = `curl -X POST ${API_BASE}/api/v1/oauth/token \\
  -H 'Content-Type: application/json' \\
  -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'`;

const SDK_SNIPPET = `import { PayChainClient } from '@paychain/sdk';

const client = new PayChainClient({
  baseUrl: process.env.PAYCHAIN_URL!,
  clientId: process.env.PAYCHAIN_CLIENT_ID!,
  clientSecret: process.env.PAYCHAIN_CLIENT_SECRET!,
});

const wallet = await client.wallets.create({ ownerType: 'CUSTOMER', ownerReference: 'alice' });
const asset = await client.assets.create({ assetCode: 'PTS', assetName: 'Loyalty Points' });
await client.assets.activate(asset.id);
await client.assets.issue(asset.id, { destinationWalletId: wallet.id, amount: '100' });`;

const RESOURCES = [
  { title: 'Wallets API', desc: 'Create sponsored wallets, read balances' },
  { title: 'Assets API', desc: 'Create, activate, issue, transfer, redeem, burn' },
  { title: 'Loyalty (earn)', desc: 'Rules-driven point accrual' },
  { title: 'Compensation', desc: 'Reverse business events safely' },
  { title: 'Webhooks', desc: 'Signed events with replay protection' },
  { title: 'Idempotency', desc: 'Safe retries on every write' },
];

export default function Page() {
  return (
    <div className="wrap">
      <div className="brand">
        Pay<span>Chain</span>
      </div>
      <div className="tag">Developer Portal</div>

      <h1>Build on PayChain</h1>
      <p className="lead">
        Blockchain-backed digital value infrastructure. Integrate loyalty today; stablecoin
        capabilities are stubbed behind disabled feature flags until readiness gates pass.
      </p>

      <h2>1. Get an access token</h2>
      <pre>
        <code>{TOKEN_SNIPPET}</code>
      </pre>

      <h2>2. Use the TypeScript SDK</h2>
      <pre>
        <code>{SDK_SNIPPET}</code>
      </pre>

      <h2>Resources</h2>
      <div className="grid">
        {RESOURCES.map((r) => (
          <div className="card" key={r.title}>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="footer">
        API base: {API_BASE} · The first PayKH integration is loyalty-only; PayKH stablecoin
        features remain disabled until PayChain stablecoin readiness gates pass.
      </div>
    </div>
  );
}
