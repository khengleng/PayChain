import { apiGet } from '../../lib/api';

// Always render per request so live gate data is fetched (never build-time prerendered).
export const dynamic = 'force-dynamic';

interface Gate {
  key: string;
  category: string;
  title: string;
  status: string;
  evidence?: string | null;
  mandatory: boolean;
}
interface ReadinessResponse {
  summary: {
    productionReady: boolean;
    mandatoryTotal: number;
    mandatoryPassed: number;
    blockedBy: string[];
  };
  gates: Gate[];
}

export default async function ReadinessPage() {
  const data = await apiGet<ReadinessResponse>('/admin/readiness');

  if (!data) {
    return (
      <>
        <h1>Production Readiness</h1>
        <p className="subtitle">§43 gates · evidence-based · blocks mainnet until all mandatory pass</p>
        <div className="notice">
          Live readiness data is unavailable — your role may lack the <code>readiness:read</code>{' '}
          permission, or the API is unreachable.
        </div>
      </>
    );
  }

  const { summary, gates } = data;
  return (
    <>
      <h1>Production Readiness</h1>
      <p className="subtitle">§43 gates · evidence-based · blocks mainnet until all mandatory pass</p>

      <div className={`banner ${summary.productionReady ? 'ready' : 'blocked'}`}>
        <div className="big">
          {summary.productionReady ? '✅ Production-ready' : '⛔ Production / mainnet BLOCKED'}
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>
          {summary.mandatoryPassed}/{summary.mandatoryTotal} mandatory gates passed
          {summary.blockedBy.length > 0 && <> · blocked by: {summary.blockedBy.join(', ')}</>}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gate</th>
              <th>Category</th>
              <th>Status</th>
              <th className="wrap">Evidence</th>
              <th>Mandatory</th>
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.key}>
                <td>{g.title}</td>
                <td>{g.category}</td>
                <td>
                  <span className={`pill ${g.status}`}>{g.status}</span>
                </td>
                <td className="wrap" style={{ color: 'var(--muted)' }}>{g.evidence ?? '—'}</td>
                <td>{g.mandatory ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
