import { apiGet } from '../../lib/api';
import { DataTable, StatusPill, Unavailable, Mono, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface ReserveRow {
  id: string;
  tenant: string;
  assetId: string;
  label: string;
  custodianReference: string | null;
  bankReference: string | null;
  balance: string;
  status: string;
  createdAt: string;
}

export default async function ReservePage() {
  const data = await apiGet<{ items: ReserveRow[] }>('/admin/reserve');

  return (
    <>
      <div className="head-row">
        <h1>Reserve</h1>
        {data && <span className="count">{data.items.length} account(s)</span>}
      </div>
      <p className="subtitle">Reserve accounts (references only — no stored bank credentials) · ratios · proof-of-reserve</p>

      {!data ? (
        <Unavailable perm="reserve:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(r) => r.id}
          empty="No reserve accounts registered."
          columns={[
            { header: 'Tenant', cell: (r) => r.tenant },
            { header: 'Label', cell: (r) => r.label },
            { header: 'Asset', cell: (r) => <Mono value={r.assetId} /> },
            { header: 'Custodian', cell: (r) => r.custodianReference ?? '—' },
            { header: 'Bank ref', cell: (r) => r.bankReference ?? '—' },
            { header: 'Balance', num: true, cell: (r) => r.balance },
            { header: 'Status', cell: (r) => <StatusPill value={r.status} /> },
            { header: 'Created', cell: (r) => fmtDate(r.createdAt) },
          ]}
        />
      )}
    </>
  );
}
