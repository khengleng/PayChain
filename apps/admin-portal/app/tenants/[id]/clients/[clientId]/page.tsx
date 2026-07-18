import Link from 'next/link';
import { apiGet } from '../../../../../lib/api';
import { DataTable, Mono, StatusPill, Unavailable, fmtDate } from '../../../../_components/DataTable';

export const dynamic = 'force-dynamic';

interface ClientActivityData {
  client: {
    id: string;
    clientId: string;
    name: string;
    tenantId: string;
    scopes: string[];
    status: string;
    createdBy: string | null;
    ownerEmail: string | null;
    requestsPerMinuteLimit: number;
    writeRequestsPerMinuteLimit: number;
    lastTokenIssuedAt: string | null;
    lastApiRequestAt: string | null;
    failedAuthAttempts24h: number;
    lastFailedAuthAt: string | null;
    requestCount24h: number;
    errorCount24h: number;
    createdAt: string;
    updatedAt: string;
  };
  recentRequests: Array<{
    id: string;
    method: string;
    route: string;
    statusCode: number;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
  recentAuthAttempts: Array<{
    id: string;
    success: boolean;
    failureReason: string | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
  }>;
}

export default async function ClientActivityPage({
  params,
}: {
  params: { id: string; clientId: string };
}) {
  const data = await apiGet<ClientActivityData>(`/admin/clients/${params.clientId}/activity`);

  if (!data) return <Unavailable perm="client:read" />;

  return (
    <>
      <div className="head-row">
        <h1>Client Activity</h1>
        <Link className="btn-sm" href={`/tenants/${params.id}/clients`}>← API Credentials</Link>
      </div>
      <p className="subtitle">
        Live operator view of one API credential: policy, recent request traffic, and auth failures.
      </p>

      <div className="form-card" style={{ maxWidth: 980, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="login-label">Label</div>
            <div>{data.client.name}</div>
          </div>
          <div>
            <div className="login-label">Client ID</div>
            <Mono value={data.client.clientId} max={24} />
          </div>
          <div>
            <div className="login-label">Status</div>
            <StatusPill value={data.client.status} />
          </div>
          <div>
            <div className="login-label">Owner</div>
            <div>{data.client.ownerEmail ?? '—'}</div>
          </div>
          <div>
            <div className="login-label">Rate policy</div>
            <div>{data.client.requestsPerMinuteLimit}/{data.client.writeRequestsPerMinuteLimit} all/write per min</div>
          </div>
          <div>
            <div className="login-label">24h request window</div>
            <div>{data.client.requestCount24h} req · {data.client.errorCount24h} err</div>
          </div>
          <div>
            <div className="login-label">24h auth failures</div>
            <div>{data.client.failedAuthAttempts24h}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Recent Requests</div>
      <DataTable
        rows={data.recentRequests}
        rowKey={(row) => row.id}
        empty="No recent API requests recorded."
        columns={[
          { header: 'When', cell: (row) => fmtDate(row.createdAt) },
          { header: 'Method', cell: (row) => <span className="mono">{row.method}</span> },
          { header: 'Route', wrap: true, cell: (row) => <span className="mono" style={{ fontSize: 12 }}>{row.route}</span> },
          { header: 'Status', cell: (row) => <StatusPill value={String(row.statusCode)} /> },
          { header: 'IP', cell: (row) => row.ip ?? '—' },
          { header: 'Agent', wrap: true, cell: (row) => row.userAgent ?? '—' },
        ]}
      />

      <div className="section-title" style={{ marginTop: 28 }}>Recent Auth Attempts</div>
      <DataTable
        rows={data.recentAuthAttempts}
        rowKey={(row) => row.id}
        empty="No token auth attempts recorded."
        columns={[
          { header: 'When', cell: (row) => fmtDate(row.createdAt) },
          { header: 'Outcome', cell: (row) => <StatusPill value={row.success ? 'SUCCESS' : 'FAILED'} /> },
          { header: 'Reason', wrap: true, cell: (row) => row.failureReason ?? '—' },
          { header: 'IP', cell: (row) => row.ip ?? '—' },
          { header: 'Agent', wrap: true, cell: (row) => row.userAgent ?? '—' },
        ]}
      />
    </>
  );
}
