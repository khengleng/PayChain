// Admin dashboard. Shows live PayChain health + a production-readiness summary, and links
// to each admin section.
import Link from 'next/link';
import { apiGet, API_BASE } from '../lib/api';
import { getSession } from '../lib/session';

// Always render per request (live health + readiness).
export const dynamic = 'force-dynamic';

interface HealthState {
  api: boolean;
  database: boolean;
  chain: { healthy: boolean; network?: string; latestLedger?: number } | null;
}
interface OverviewData {
  readiness: {
    productionReady: boolean;
    mandatoryPassed: number;
    mandatoryTotal: number;
    blockedBy: string[];
  } | null;
  counts: {
    tenants: number | null;
    wallets: number | null;
    assets: number | null;
    stablecoins: number | null;
    reserveAccounts: number | null;
    treasuryPending: number | null;
    complianceOpen: number | null;
    reconciliationOpen: number | null;
    flagOverrides: number | null;
    recentAuditEvents: number | null;
  };
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
  { title: 'Readiness', href: '/readiness', desc: 'Production gates — blocks mainnet until all pass', key: 'readiness' },
  { title: 'Stablecoins', href: '/stablecoins', desc: 'Lifecycle, gates, activation (flags OFF)', key: 'stablecoins' },
  { title: 'Reserve', href: '/reserve', desc: 'Snapshots, ratios, proof-of-reserve', key: 'reserveAccounts' },
  { title: 'Treasury', href: '/treasury', desc: 'Maker-checker movements', key: 'treasuryPending' },
  { title: 'Compliance', href: '/compliance', desc: 'KYC/AML/sanctions alerts', key: 'complianceOpen' },
  { title: 'Reconciliation', href: '/reconciliation', desc: 'Exception queue', key: 'reconciliationOpen' },
  { title: 'Feature Flags', href: '/feature-flags', desc: 'stablecoin.* flags', key: 'flagOverrides' },
  { title: 'Wallets', href: '/wallets', desc: 'Search, freeze, limits', key: 'wallets' },
  { title: 'Assets', href: '/assets', desc: 'Issuance, supply', key: 'assets' },
  { title: 'Audit Logs', href: '/audit-logs', desc: 'Privileged + financial actions', key: 'recentAuditEvents' },
];

const SUPER_ADMIN_SECTIONS = [
  { title: 'Tenants', href: '/tenants', desc: 'Provision partners such as PayKH/trustee, create wholesaler and retailer trees.' },
  { title: 'Admins', href: '/admins', desc: 'Assign platform roles, tenant scopes, and super-admin ownership boundaries.' },
  { title: 'Access Control', href: '/access-control', desc: 'Inspect the live RBAC/ABAC model enforced by the API.' },
  { title: 'Readiness', href: '/readiness', desc: 'Approve gates, review evidence, and control the mainnet readiness path.' },
];

function Dot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? 'ok' : 'err'}`} />;
}

export default async function Page() {
  const session = getSession();
  const [health, overview] = await Promise.all([
    getHealth(),
    apiGet<OverviewData>('/admin/overview'),
  ]);
  const summary = overview?.readiness;
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  function sectionMeta(section: (typeof SECTIONS)[number]) {
    if (!overview) return null;
    if (section.key === 'readiness') {
      return summary
        ? `${summary.mandatoryPassed}/${summary.mandatoryTotal} mandatory gates passed`
        : null;
    }
    const value = overview.counts[section.key as keyof OverviewData['counts']];
    if (value === null) return null;
    if (section.key === 'treasuryPending') return `${value} pending approval`;
    if (section.key === 'complianceOpen') return `${value} open alert${value === 1 ? '' : 's'}`;
    if (section.key === 'reconciliationOpen') return `${value} unresolved exception${value === 1 ? '' : 's'}`;
    if (section.key === 'flagOverrides') return `${value} tenant override${value === 1 ? '' : 's'}`;
    if (section.key === 'recentAuditEvents') return `${value} audit event${value === 1 ? '' : 's'}`;
    return `${value} record${value === 1 ? '' : 's'}`;
  }

  return (
    <>
      <h1>Overview</h1>
      <p className="subtitle">
        {isSuperAdmin
          ? 'Super-admin command center for the PayChain control plane'
          : 'PayChain platform status'}
      </p>

      {isSuperAdmin && (
        <div className="banner ready">
          <div className="big">Super admin scope</div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>
            Full platform visibility and role management, plus tenant onboarding, readiness control,
            reserve/treasury governance, and audit oversight for the PayKH-aligned control plane.
          </div>
        </div>
      )}

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
            {sectionMeta(s) && (
              <p style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>{sectionMeta(s)}</p>
            )}
          </Link>
        ))}
      </div>

      {isSuperAdmin && (
        <>
          <div className="section-title" style={{ marginTop: 32 }}>Super Admin Focus</div>
          <div className="cards">
            {SUPER_ADMIN_SECTIONS.map((s) => (
              <Link className="card" key={s.href} href={s.href} style={{ display: 'block' }}>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="footer">
        PayChain Admin Portal. Production stablecoin features remain behind disabled feature flags
        and approval gates. See <Link href="/readiness">Readiness</Link>.
      </div>
    </>
  );
}
