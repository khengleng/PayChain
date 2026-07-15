const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

const TOKEN_SNIPPET = `curl -X POST ${API_BASE}/api/v1/oauth/token \\
  -H 'Content-Type: application/json' \\
  -d '{"grant_type":"client_credentials","client_id":"...","client_secret":"..."}'`;

const FLOW_SNIPPET = `# 1. get a token (above)  2. create wallet  3. create + activate asset  4. issue
curl -X POST ${API_BASE}/api/v1/wallets \\
  -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $(uuidgen)" \\
  -d '{"ownerType":"CUSTOMER","ownerReference":"alice"}'`;

export default function Page() {
  return (
    <div className="wrap">
      <h1>Build on PayChain</h1>
      <p className="lead">
        Blockchain-backed digital value infrastructure. Integrate loyalty today; stablecoin
        capabilities are stubbed behind disabled feature flags until readiness gates pass.
      </p>

      <h2>1. Get an access token</h2>
      <pre>
        <code>{TOKEN_SNIPPET}</code>
      </pre>

      <h2>2. Move value</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Every write takes an <span className="mono">Idempotency-Key</span> so retries never
        double-apply. See the <a href="/api-reference">API reference</a> and the{' '}
        <a href="/sdk">TypeScript SDK</a>.
      </p>
      <pre>
        <code>{FLOW_SNIPPET}</code>
      </pre>

      <h2>Next</h2>
      <div className="grid">
        <a className="card" href="/api-reference">
          <h3>API reference</h3>
          <p>Wallets, assets, transactions, stablecoin workflows</p>
        </a>
        <a className="card" href="/webhooks">
          <h3>Webhooks</h3>
          <p>Signed events with replay protection</p>
        </a>
        <a className="card" href="/sdk">
          <h3>TypeScript SDK</h3>
          <p>Auth, idempotency, retries, webhook verify</p>
        </a>
        <a className="card" href="/status">
          <h3>Status</h3>
          <p>Live API / database / blockchain health</p>
        </a>
      </div>

      <div className="footer">
        API base: {API_BASE} · The first PayKH integration is loyalty-only; PayKH stablecoin
        features remain disabled until PayChain stablecoin readiness gates pass.
      </div>
    </div>
  );
}
