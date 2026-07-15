// Admin dashboard foundation (§37). Server component that shows live PayChain API health
// plus the admin sections this portal will manage. This is an M2 foundation shell — the
// per-section CRUD screens (backed by the API) are layered on in later work.

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://paychain-api-production-90f0.up.railway.app';

interface HealthState {
  api: boolean;
  database: boolean;
  chain: { healthy: boolean; network?: string; latestLedger?: number } | null;
}

async function getHealth(): Promise<HealthState> {
  const get = async (path: string) => {
    try {
      const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };
  const [ready, chain] = await Promise.all([get('/api/v1/health/ready'), get('/api/v1/health/blockchain')]);
  return {
    api: ready !== null,
    database: ready?.database === true,
    chain,
  };
}

const SECTIONS = [
  { title: 'Stablecoins', desc: 'Lifecycle, gates, activation (flags OFF by default)' },
  { title: 'Reserve', desc: 'Snapshots, ratios, proof-of-reserve, attestations' },
  { title: 'Treasury', desc: 'Liquidity, balances, maker-checker movements' },
  { title: 'Compliance', desc: 'KYC/AML/sanctions alerts and cases' },
  { title: 'Reconciliation', desc: 'Exception queue across chain and records' },
  { title: 'Feature Flags', desc: 'stablecoin.* flags per tenant / global' },
  { title: 'Wallets & Assets', desc: 'Search, freeze, limits, transactions' },
  { title: 'Audit Logs', desc: 'Every privileged and financial action' },
];

function Dot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? 'ok' : 'err'}`} />;
}

export default async function Page() {
  const health = await getHealth();
  return (
    <>
      <h1>Overview</h1>
      <p className="subtitle">PayChain platform status · API: {API_BASE}</p>

      <div className="tiles">
        <div className="tile">
          <div className="label">API</div>
          <div className="value">
            <Dot ok={health.api} /> {health.api ? 'Online' : 'Unreachable'}
          </div>
        </div>
        <div className="tile">
          <div className="label">Database</div>
          <div className="value">
            <Dot ok={health.database} /> {health.database ? 'Connected' : 'Down'}
          </div>
        </div>
        <div className="tile">
          <div className="label">Blockchain</div>
          <div className="value">
            <Dot ok={!!health.chain?.healthy} /> {health.chain?.healthy ? 'Healthy' : 'Unknown'}
          </div>
        </div>
        <div className="tile">
          <div className="label">Network / Ledger</div>
          <div className="value">
            {health.chain?.network ?? '—'}
            {health.chain?.latestLedger ? ` · #${health.chain.latestLedger}` : ''}
          </div>
        </div>
      </div>

      <div className="section-title">Administration</div>
      <div className="cards">
        {SECTIONS.map((s) => (
          <div className="card" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            <span className="badge">foundation</span>
          </div>
        ))}
      </div>

      <div className="footer">
        PayChain Admin Portal · foundation shell. Production stablecoin features remain behind
        disabled feature flags and approval gates.
      </div>
    </>
  );
}
