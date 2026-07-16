import { apiGet } from '../../lib/api';
import { DataTable, StatusPill, Unavailable, Mono, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface ExceptionRow {
  id: string;
  tenant: string;
  category: string;
  status: string;
  transactionId: string | null;
  blockchainHash: string | null;
  correlationId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export default async function ReconciliationPage() {
  const data = await apiGet<{ items: ExceptionRow[] }>('/admin/reconciliation');
  const openCount = data?.items.filter((e) => e.status === 'OPEN').length ?? 0;

  return (
    <>
      <div className="head-row">
        <h1>Reconciliation</h1>
        {data && <span className="count">{data.items.length} exception(s) · {openCount} open</span>}
      </div>
      <p className="subtitle">
        Exception queue across chain and records · discrepancies are recorded, never silently overwritten
      </p>

      {!data ? (
        <Unavailable perm="reconciliation:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(e) => e.id}
          empty="No reconciliation exceptions — records and chain agree."
          columns={[
            { header: 'Tenant', cell: (e) => e.tenant },
            { header: 'Category', cell: (e) => e.category },
            { header: 'Status', cell: (e) => <StatusPill value={e.status} /> },
            { header: 'Transaction', cell: (e) => <Mono value={e.transactionId} /> },
            { header: 'Chain hash', cell: (e) => <Mono value={e.blockchainHash} max={10} /> },
            { header: 'Raised', cell: (e) => fmtDate(e.createdAt) },
            { header: 'Resolved', cell: (e) => fmtDate(e.resolvedAt) },
            { header: 'By', cell: (e) => e.resolvedBy ?? '—' },
          ]}
        />
      )}
    </>
  );
}
