import { apiGet } from '../../lib/api';
import { DataTable, StatusPill, Unavailable, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface TenantRow {
  id: string;
  name: string;
  status: string;
  apiClients: number;
  wallets: number;
  assets: number;
  createdAt: string;
}

export default async function TenantsPage() {
  const data = await apiGet<{ items: TenantRow[] }>('/admin/tenants');

  return (
    <>
      <div className="head-row">
        <h1>Tenants</h1>
        {data && <span className="count">{data.items.length} tenant(s)</span>}
      </div>
      <p className="subtitle">Client organizations that consume PayChain · tenant isolation enforced platform-wide</p>

      {!data ? (
        <Unavailable perm="tenant:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(t) => t.id}
          empty="No tenants provisioned yet."
          columns={[
            { header: 'Name', cell: (t) => t.name },
            { header: 'Status', cell: (t) => <StatusPill value={t.status} /> },
            { header: 'API clients', num: true, cell: (t) => t.apiClients },
            { header: 'Wallets', num: true, cell: (t) => t.wallets },
            { header: 'Assets', num: true, cell: (t) => t.assets },
            { header: 'Created', cell: (t) => fmtDate(t.createdAt) },
          ]}
        />
      )}
    </>
  );
}
