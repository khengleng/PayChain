import { apiGet } from '../../lib/api';
import { DataTable, Unavailable, Mono, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface AuditRow {
  id: string;
  tenant: string | null;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export default async function AuditLogsPage() {
  const data = await apiGet<{ items: AuditRow[] }>('/admin/audit');

  return (
    <>
      <div className="head-row">
        <h1>Audit Logs</h1>
        {data && <span className="count">most recent {data.items.length}</span>}
      </div>
      <p className="subtitle">Append-only record of privileged and financial actions · correlation ids across API / worker / chain</p>

      {!data ? (
        <Unavailable perm="audit:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(l) => l.id}
          empty="No audit entries yet."
          columns={[
            { header: 'When', cell: (l) => fmtDate(l.createdAt) },
            { header: 'Actor', cell: (l) => l.actor },
            { header: 'Action', cell: (l) => <span className="mono" style={{ fontSize: 12 }}>{l.action}</span> },
            { header: 'Resource', cell: (l) => `${l.resourceType}${l.resourceId ? ` · ${l.resourceId.slice(0, 8)}…` : ''}` },
            { header: 'Tenant', cell: (l) => l.tenant ?? '—' },
            { header: 'Correlation', cell: (l) => <Mono value={l.correlationId} max={10} /> },
          ]}
        />
      )}
    </>
  );
}
