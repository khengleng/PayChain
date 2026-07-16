export const dynamic = 'force-dynamic';

const API_BASE =
  process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com';

async function get(path: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`dot ${ok ? 'ok' : 'err'}`} />;
}

export default async function Status() {
  const [ready, chain] = await Promise.all([get('/api/v1/health/ready'), get('/api/v1/health/blockchain')]);
  const apiUp = ready !== null;
  const dbUp = ready?.database === true;
  const chainUp = chain?.healthy === true;

  return (
    <div className="wrap">
      <h1>Status</h1>
      <p className="lead">Live PayChain platform health · {API_BASE}</p>
      <div className="tiles">
        <div className="tile">
          <div className="label">API</div>
          <div className="value"><Dot ok={apiUp} /> {apiUp ? 'Online' : 'Unreachable'}</div>
        </div>
        <div className="tile">
          <div className="label">Database</div>
          <div className="value"><Dot ok={dbUp} /> {dbUp ? 'Connected' : 'Down'}</div>
        </div>
        <div className="tile">
          <div className="label">Blockchain</div>
          <div className="value"><Dot ok={chainUp} /> {chainUp ? 'Healthy' : 'Unknown'}</div>
        </div>
        <div className="tile">
          <div className="label">Network / Ledger</div>
          <div className="value" style={{ fontSize: 15 }}>
            {(chain?.network as string) ?? '—'}
            {chain?.latestLedger ? ` · #${chain.latestLedger}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
