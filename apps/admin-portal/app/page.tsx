// Admin dashboard. Shows live PayChain health + a production-readiness summary, and links
// to each admin section.
import Link from 'next/link';
import { apiGet, API_BASE } from '../lib/api';

// Always render per request (live health + readiness).
export const dynamic = 'force-dynamic';

interface HealthState {
  api: boolean;
  database: boolean;
  chain: { healthy: boolean; network?: string; latestLedger?: number } | null;
}
interface ReadinessSummary {
  productionReady: boolean;
  mandatoryPassed: number;
  mandatoryTotal: number;
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
  return { api: ready !== null, database: ready?.database === true, chain };
}

const SECTIONS = [
  { title: 'Readiness', href: '/readiness', desc: 'Production gates — blocks mainnet until all pass' },
  { title: 'Stablecoins', href: '/stablecoins', desc: 'Lifecycle, gates, activation (flags OFF)' },
  { title: 'Reserve', href: '/reserve', desc: 'Snapshots, ratios, proof-of-reserve' },
  { title: 'Treasury', href: '/treasury', desc: 'Maker-checker movements' },
  { title: 'Compliance', href: '/compliance', desc: 'KYC/AML/sanctions alerts' },
  { title: 'Reconciliation', href: '/reconciliation', desc: 'Exception queue' },
  { title: 'Feature Flags', href: '/feature-flags', desc: 'stablecoin.* flags' },
  { title: 'Wallets', href: '/wallets', desc: 'Search, freeze, limits' },
  { title: 'Assets', href: '/assets', desc: 'Issuance, supply' },
  { title: 'Audit Logs', href: '/audit-logs', desc: 'Privileged + financial actions' },
];

function Dot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? 'ok' : 'err'}`} />;
}

export default async function Page() {
  const [health, readiness] = await Promise.all([
    getHealth(),
    apiGet<{ summary: ReadinessSummary }>('/admin/readiness'),
  ]);
  const summary = readiness?.summary;

  return (
    <>
      <h1>Overview</h1>
      <p className="subtitle">PayChain platform status · API: {API_BASE}</p>

      <div className="tiles">
        <div className="tile">
          <div className="label">API</div>
          <div className="value"><Dot ok={health.api} /> {health.api ? 'Online' : 'Unreachable'}</div>
        </div>
        <div className="tile">
          <div className="label">Database</div>
          <div className="value"><Dot ok={health.database} /> {health.database ? 'Connected' : 'Down'}</div>
        </div>
        <div className="tile">
          <div className="label">Blockchain</div>
          <div className="value"><Dot ok={!!health.chain?.healthy} /> {health.chain?.healthy ? 'Healthy' : 'Unknown'}</div>
        </div>
        <div className="tile">
          <div className="label">Production readiness</div>
          <div className="value">
            {summary ? (
              <>
                <Dot ok={summary.productionReady} /> {summary.productionReady ? 'Ready' : 'Blocked'}
                <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 400 }}>
                  {' '}({summary.mandatoryPassed}/{summary.mandatoryTotal})
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>—</span>
            )}
          </div>
        </div>
      </div>

      <div className="section-title">Administration</div>
      <div className="cards">
        {SECTIONS.map((s) => (
          <Link className="card" key={s.href} href={s.href} style={{ display: 'block' }}>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="footer">
        PayChain Admin Portal. Production stablecoin features remain behind disabled feature flags
        and approval gates. See <Link href="/readiness">Readiness</Link>.
      </div>
    </>
  );
}
