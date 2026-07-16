interface Endpoint {
  method: string;
  path: string;
  desc: string;
}
interface Group {
  title: string;
  note?: string;
  endpoints: Endpoint[];
}

const GROUPS: Group[] = [
  {
    title: 'Auth',
    endpoints: [{ method: 'POST', path: '/api/v1/oauth/token', desc: 'OAuth2 client-credentials → JWT' }],
  },
  {
    title: 'Wallets',
    note: 'Wallets are custodial: PayChain generates and holds the Stellar key. New accounts are funded by testnet friendbot — customers never hold or buy XLM. Reserve/fee sponsorship is not yet implemented.',
    endpoints: [
      { method: 'POST', path: '/api/v1/wallets', desc: 'Create a managed wallet (idempotent)' },
      { method: 'GET', path: '/api/v1/wallets/{id}', desc: 'Get a wallet' },
      { method: 'GET', path: '/api/v1/wallets/{id}/balances', desc: 'Rebuildable balance read-model' },
    ],
  },
  {
    title: 'Assets & loyalty',
    endpoints: [
      { method: 'POST', path: '/api/v1/assets', desc: 'Create an asset' },
      { method: 'POST', path: '/api/v1/assets/{id}/activate', desc: 'Activate' },
      { method: 'POST', path: '/api/v1/assets/{id}/issue', desc: 'Issue' },
      { method: 'POST', path: '/api/v1/assets/{id}/transfer', desc: 'Transfer' },
      { method: 'POST', path: '/api/v1/assets/{id}/redeem', desc: 'Redeem' },
      { method: 'POST', path: '/api/v1/assets/{id}/earn', desc: 'Earn via rules engine' },
    ],
  },
  {
    title: 'Transactions',
    endpoints: [
      { method: 'GET', path: '/api/v1/transactions/{id}', desc: 'Get a transaction' },
      { method: 'POST', path: '/api/v1/transactions/{id}/compensate', desc: 'Business reversal (maker-checker over threshold)' },
    ],
  },
  {
    title: 'Stablecoins (flag-gated, OFF by default)',
    note: 'Disabled until PayChain readiness gates pass — see the Admin portal › Readiness.',
    endpoints: [
      { method: 'POST', path: '/api/v1/stablecoins', desc: 'Create (control plane)' },
      { method: 'POST', path: '/api/v1/stablecoins/{id}/mint-requests', desc: 'Mint saga (reserve-confirm first)' },
      { method: 'POST', path: '/api/v1/stablecoins/{id}/redemptions', desc: 'Redemption saga (burn after payout)' },
      { method: 'POST', path: '/api/v1/conversions/quote', desc: 'Loyalty→stablecoin quote' },
    ],
  },
  {
    title: 'Webhooks & health',
    endpoints: [
      { method: 'POST', path: '/api/v1/webhooks', desc: 'Register an endpoint (secret returned once)' },
      { method: 'GET', path: '/api/v1/health', desc: 'Liveness' },
      { method: 'GET', path: '/api/v1/health/blockchain', desc: 'Stellar provider health' },
    ],
  },
];

export default function ApiReference() {
  return (
    <div className="wrap">
      <h1>API Reference</h1>
      <p className="lead">Base URL is versioned under <span className="mono">/api/v1</span>. All writes require an <span className="mono">Idempotency-Key</span>.</p>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          {g.note && <p className="lead" style={{ fontSize: 13 }}>{g.note}</p>}
          <div className="table-wrap">
            <table>
              <tbody>
                {g.endpoints.map((e) => (
                  <tr key={e.path + e.method}>
                    <td className="mono" style={{ width: 60, color: '#4f8cff' }}>{e.method}</td>
                    <td className="mono">{e.path}</td>
                    <td style={{ color: 'var(--muted)' }}>{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
