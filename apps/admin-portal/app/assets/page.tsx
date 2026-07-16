import { apiGet } from '../../lib/api';
import { DataTable, StatusPill, Unavailable, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface AssetRow {
  id: string;
  tenant: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  status: string;
  transferability: boolean;
  redeemability: boolean;
  expiryPolicy: string;
  createdAt: string;
}

function YesNo({ v }: { v: boolean }) {
  return <span style={{ color: v ? 'var(--ok)' : 'var(--muted)' }}>{v ? 'Yes' : 'No'}</span>;
}

export default async function AssetsPage() {
  const data = await apiGet<{ items: AssetRow[] }>('/admin/assets');

  return (
    <>
      <div className="head-row">
        <h1>Assets</h1>
        {data && <span className="count">{data.items.length} asset(s)</span>}
      </div>
      <p className="subtitle">Loyalty points and other digital assets across all tenants</p>

      {!data ? (
        <Unavailable perm="asset:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(a) => a.id}
          empty="No assets created yet."
          columns={[
            { header: 'Tenant', cell: (a) => a.tenant },
            { header: 'Code', cell: (a) => <span className="mono" style={{ fontSize: 12 }}>{a.assetCode}</span> },
            { header: 'Name', cell: (a) => a.assetName },
            { header: 'Type', cell: (a) => a.assetType },
            { header: 'Status', cell: (a) => <StatusPill value={a.status} /> },
            { header: 'Transfer', cell: (a) => <YesNo v={a.transferability} /> },
            { header: 'Redeem', cell: (a) => <YesNo v={a.redeemability} /> },
            { header: 'Expiry', cell: (a) => a.expiryPolicy },
            { header: 'Created', cell: (a) => fmtDate(a.createdAt) },
          ]}
        />
      )}
    </>
  );
}
