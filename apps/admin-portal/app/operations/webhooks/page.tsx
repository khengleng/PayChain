import { apiGet } from '../../../lib/api';
import { DataTable, Mono, StatusPill, Unavailable, fmtDate } from '../../_components/DataTable';

export const dynamic = 'force-dynamic';

interface WebhookFailureRow {
  id: string;
  tenant: string;
  endpointUrl: string;
  endpointStatus: string;
  eventType: string;
  eventId: string;
  status: string;
  attempts: number;
  lastError: string | null;
  correlationId: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export default async function WebhookOperationsPage() {
  const data = await apiGet<{ items: WebhookFailureRow[] }>('/admin/operations/webhooks');

  if (!data) return <Unavailable perm="audit:read" />;

  return (
    <>
      <h1>Webhook Operations</h1>
      <p className="subtitle">
        Failed and dead-letter webhook deliveries. These are the integrations currently not keeping up.
      </p>
      <DataTable
        rows={data.items}
        rowKey={(row) => row.id}
        empty="No failed or dead webhook deliveries."
        columns={[
          { header: 'Tenant', cell: (row) => row.tenant },
          { header: 'Endpoint', wrap: true, cell: (row) => row.endpointUrl },
          { header: 'Event', cell: (row) => <span className="mono">{row.eventType}</span> },
          { header: 'Event ID', cell: (row) => <Mono value={row.eventId} max={16} /> },
          { header: 'Status', cell: (row) => <StatusPill value={row.status} /> },
          { header: 'Attempts', num: true, cell: (row) => row.attempts },
          { header: 'Last error', wrap: true, cell: (row) => row.lastError ?? '—' },
          { header: 'Correlation', cell: (row) => <Mono value={row.correlationId} max={12} /> },
          { header: 'Created', cell: (row) => fmtDate(row.createdAt) },
        ]}
      />
    </>
  );
}
