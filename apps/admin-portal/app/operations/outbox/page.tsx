import { apiGet } from '../../../lib/api';
import { DataTable, Mono, StatusPill, Unavailable, fmtDate } from '../../_components/DataTable';

export const dynamic = 'force-dynamic';

interface OutboxRow {
  id: string;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  status: string;
  attempts: number;
  correlationId: string;
  createdAt: string;
  processedAt: string | null;
}

export default async function OutboxOperationsPage() {
  const data = await apiGet<{ items: OutboxRow[] }>('/admin/operations/outbox');

  if (!data) return <Unavailable perm="audit:read" />;

  return (
    <>
      <h1>Outbox Operations</h1>
      <p className="subtitle">
        Transactional outbox rows that are failed, pending, or stuck in processing. This is the handoff queue behind webhook fan-out.
      </p>
      <DataTable
        rows={data.items}
        rowKey={(row) => row.id}
        empty="No failed or pending outbox events."
        columns={[
          { header: 'Tenant', cell: (row) => row.tenantId },
          { header: 'Aggregate', cell: (row) => `${row.aggregateType} · ${row.aggregateId}` },
          { header: 'Event', cell: (row) => <span className="mono">{row.eventType}</span> },
          { header: 'Status', cell: (row) => <StatusPill value={row.status} /> },
          { header: 'Attempts', num: true, cell: (row) => row.attempts },
          { header: 'Correlation', cell: (row) => <Mono value={row.correlationId} max={12} /> },
          { header: 'Created', cell: (row) => fmtDate(row.createdAt) },
          { header: 'Processed', cell: (row) => fmtDate(row.processedAt) },
        ]}
      />
    </>
  );
}
