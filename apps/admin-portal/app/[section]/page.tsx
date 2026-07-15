import { notFound } from 'next/navigation';

interface SectionInfo {
  title: string;
  subtitle: string;
  manages: string[];
  api?: string[];
  status: string;
}

const SECTIONS: Record<string, SectionInfo> = {
  tenants: {
    title: 'Tenants',
    subtitle: 'Client organizations that consume PayChain',
    manages: ['Create / suspend tenants', 'Provision API clients + scopes', 'Per-tenant feature flags'],
    api: ['POST /api/v1/oauth/token', 'seed: PayKH Sandbox tenant'],
    status: 'Tenant isolation enforced platform-wide; admin CRUD screens are a foundation.',
  },
  wallets: {
    title: 'Wallets',
    subtitle: 'Sponsored Stellar accounts per customer/merchant',
    manages: ['Search wallets', 'Freeze / unfreeze', 'Balances + transactions', 'Limits'],
    api: ['POST /api/v1/wallets', 'GET /api/v1/wallets/{id}/balances'],
    status: 'Wallet lifecycle + balances live via API; search UI is a foundation.',
  },
  assets: {
    title: 'Assets',
    subtitle: 'Loyalty points and other digital assets',
    manages: ['Create / activate assets', 'Issue / transfer / redeem / burn', 'Supply monitoring'],
    api: ['POST /api/v1/assets', 'POST /api/v1/assets/{id}/issue'],
    status: 'Full loyalty asset lifecycle live on testnet.',
  },
  stablecoins: {
    title: 'Stablecoins',
    subtitle: 'Stable-value asset control plane + workflows',
    manages: ['Lifecycle + approval gates', 'Mint / redeem / convert (mock+testnet)', 'Wallet policies'],
    api: ['POST /api/v1/stablecoins', 'POST /api/v1/stablecoins/{id}/mint-requests'],
    status: 'All production flags OFF by default; activation blocked until gates pass. See Readiness.',
  },
  reserve: {
    title: 'Reserve',
    subtitle: 'Reserve accounts, ratios, proof-of-reserve',
    manages: ['Reserve accounts (references only)', 'Ratio + outstanding-supply', 'Snapshots + attestations'],
    api: ['GET /api/v1/stablecoins/{id}/reserve', 'POST /api/v1/stablecoins/{id}/reserve-snapshots'],
    status: 'Reserve module live; proof-of-reserve data model in place.',
  },
  treasury: {
    title: 'Treasury',
    subtitle: 'Liquidity + maker-checker movements',
    manages: ['Treasury movements', 'Maker-checker (create ≠ approve)', 'Balances'],
    api: ['POST /api/v1/treasury/movements', 'POST /api/v1/treasury/movements/{id}/approve'],
    status: 'Maker-checker enforced; movement execution is mock in the current build.',
  },
  compliance: {
    title: 'Compliance',
    subtitle: 'KYC / AML / sanctions alerts and cases',
    manages: ['Transaction monitoring alerts', 'Automated holds (CRITICAL)', 'Cases'],
    api: ['GET /api/v1/monitoring/alerts', 'POST /api/v1/monitoring/evaluate'],
    status: 'Monitoring rules + audited holds live; provider is a mock (real vendor is a pilot gate).',
  },
  reconciliation: {
    title: 'Reconciliation',
    subtitle: 'Exception queue across chain and records',
    manages: ['Record-vs-chain checks', 'Exception categories', 'Never auto-conceal'],
    api: ['worker: reconcile job (10s/60s cadence)'],
    status: 'Reconciliation runs on the worker; exception queue never overwrites mismatches.',
  },
  'feature-flags': {
    title: 'Feature Flags',
    subtitle: 'stablecoin.* flags per tenant / global',
    manages: ['All production flags default OFF', 'Tenant overrides', 'Emergency suspend'],
    api: ['POST /api/v1/admin/emergency (suspend/resume)'],
    status: 'Flags default OFF; emergency controls audited.',
  },
  'audit-logs': {
    title: 'Audit Logs',
    subtitle: 'Every privileged and financial action',
    manages: ['Append-only audit trail', 'Correlation ids', 'Emergency control events'],
    api: ['GET /api/v1/admin/emergency/events'],
    status: 'Audit logging live across API/worker; queryable log UI is a foundation.',
  },
};

export default function SectionPage({ params }: { params: { section: string } }) {
  const info = SECTIONS[params.section];
  if (!info) notFound();

  return (
    <>
      <h1>{info.title}</h1>
      <p className="subtitle">{info.subtitle}</p>

      <div className="cards" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3>Manages</h3>
          <ul className="clean">
            {info.manages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
        {info.api && (
          <div className="card">
            <h3>API</h3>
            <ul className="clean">
              {info.api.map((a) => (
                <li key={a} style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="notice">
        {info.status} <span className="badge">foundation</span>
      </div>
    </>
  );
}
