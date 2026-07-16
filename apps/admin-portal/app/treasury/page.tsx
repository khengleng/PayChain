import { apiGet } from '../../lib/api';
import { can, getSession } from '../../lib/session';
import { DataTable, StatusPill, Unavailable, fmtDate } from '../_components/DataTable';
import { TreasuryActions } from '../_components/actions';

export const dynamic = 'force-dynamic';

interface MovementRow {
  id: string;
  tenant: string;
  fromAccount: string;
  toAccount: string;
  amount: string;
  purpose: string;
  status: string;
  createdBy: string;
  approvedBy: string | null;
  executedAt: string | null;
  createdAt: string;
}

export default async function TreasuryPage() {
  const data = await apiGet<{ items: MovementRow[] }>('/admin/treasury');
  const canWrite = can(getSession(), 'treasury:approve');

  return (
    <>
      <div className="head-row">
        <h1>Treasury</h1>
        {data && <span className="count">{data.items.length} movement(s)</span>}
      </div>
      <p className="subtitle">Liquidity movements · maker-checker enforced (the creator may not approve)</p>

      {!data ? (
        <Unavailable perm="treasury:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(m) => m.id}
          empty="No treasury movements yet."
          columns={[
            { header: 'Tenant', cell: (m) => m.tenant },
            { header: 'From', cell: (m) => m.fromAccount },
            { header: 'To', cell: (m) => m.toAccount },
            { header: 'Amount', num: true, cell: (m) => m.amount },
            { header: 'Purpose', wrap: true, cell: (m) => m.purpose },
            { header: 'Status', cell: (m) => <StatusPill value={m.status} /> },
            { header: 'Created by', cell: (m) => m.createdBy },
            { header: 'Approved by', cell: (m) => m.approvedBy ?? '—' },
            { header: 'Created', cell: (m) => fmtDate(m.createdAt) },
            { header: 'Actions', cell: (m) => <TreasuryActions id={m.id} status={m.status} canWrite={canWrite} /> },
          ]}
        />
      )}
    </>
  );
}
