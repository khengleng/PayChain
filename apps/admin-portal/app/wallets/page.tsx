import { apiGet } from '../../lib/api';
import { can, getSession } from '../../lib/session';
import { DataTable, StatusPill, Unavailable, Mono, fmtDate } from '../_components/DataTable';
import { WalletActions } from '../_components/actions';

export const dynamic = 'force-dynamic';

interface WalletRow {
  id: string;
  tenant: string;
  ownerType: string;
  ownerReference: string;
  stellarAccountId: string;
  status: string;
  verificationStatus: string;
  riskLevel: string;
  createdAt: string;
  lastActivityAt: string | null;
}

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const q = searchParams.query?.trim() ?? '';
  const path = q ? `/admin/wallets?query=${encodeURIComponent(q)}` : '/admin/wallets';
  const data = await apiGet<{ query: string | null; items: WalletRow[] }>(path);
  const canWrite = can(getSession(), 'wallet:freeze');

  return (
    <>
      <div className="head-row">
        <h1>Wallets</h1>
        {data && <span className="count">{data.items.length} shown{q && ` · matching "${q}"`}</span>}
      </div>
      <p className="subtitle">Sponsored Stellar accounts per customer / merchant</p>

      {/* GET form re-renders the server component with ?query= */}
      <form className="search" method="GET">
        <input name="query" defaultValue={q} placeholder="Search owner reference or Stellar account…" />
        <button type="submit">Search</button>
      </form>

      {!data ? (
        <Unavailable perm="wallet:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(w) => w.id}
          empty={q ? `No wallets match "${q}".` : 'No wallets created yet.'}
          columns={[
            { header: 'Tenant', cell: (w) => w.tenant },
            { header: 'Owner', cell: (w) => `${w.ownerType} · ${w.ownerReference}` },
            { header: 'Stellar account', cell: (w) => <Mono value={w.stellarAccountId} max={10} /> },
            { header: 'Status', cell: (w) => <StatusPill value={w.status} /> },
            { header: 'Verification', cell: (w) => <StatusPill value={w.verificationStatus} /> },
            { header: 'Risk', cell: (w) => <StatusPill value={w.riskLevel} /> },
            { header: 'Last activity', cell: (w) => fmtDate(w.lastActivityAt) },
            { header: 'Actions', cell: (w) => <WalletActions id={w.id} status={w.status} canWrite={canWrite} /> },
          ]}
        />
      )}
    </>
  );
}
