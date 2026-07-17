import Link from 'next/link';
import { apiGet } from '../../lib/api';
import { can, getSession } from '../../lib/session';
import { DataTable, StatusPill, Unavailable, fmtDate } from '../_components/DataTable';
import { StablecoinActions } from '../_components/actions';

export const dynamic = 'force-dynamic';

interface StablecoinRow {
  id: string;
  assetCode: string;
  assetName: string;
  classification: string;
  referenceCurrency: string;
  lifecycleState: string;
  activationStatus: string;
  reserveRatioTarget: string;
  redemptionEnabled: boolean;
  jurisdiction: string | null;
  createdAt: string;
}

export default async function StablecoinsPage() {
  const data = await apiGet<{ items: StablecoinRow[] }>('/admin/stablecoins');
  const session = getSession();
  const canManage = can(session, 'stablecoin:manage');
  const canApprove = can(session, 'stablecoin:approve');

  return (
    <>
      <div className="head-row">
        <h1>Stablecoins</h1>
        {data && <span className="count">{data.items.length} configured</span>}
      </div>
      <p className="subtitle">Stable-value control plane · all production flags OFF by default</p>

      <div className="notice" style={{ marginBottom: 20 }}>
        Activation stays blocked until every mandatory gate passes. See{' '}
        <Link href="/readiness">Readiness</Link> and <Link href="/feature-flags">Feature Flags</Link>.
      </div>

      {!data ? (
        <Unavailable perm="stablecoin:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(s) => s.id}
          empty="No stablecoin assets configured."
          columns={[
            { header: 'Asset', cell: (s) => <span className="mono" style={{ fontSize: 12 }}>{s.assetCode}</span> },
            { header: 'Name', cell: (s) => s.assetName },
            { header: 'Classification', cell: (s) => s.classification },
            { header: 'Ref', cell: (s) => s.referenceCurrency },
            { header: 'Lifecycle', cell: (s) => <StatusPill value={s.lifecycleState} /> },
            { header: 'Activation', cell: (s) => <StatusPill value={s.activationStatus} /> },
            { header: 'Reserve target', num: true, cell: (s) => s.reserveRatioTarget },
            { header: 'Jurisdiction', cell: (s) => s.jurisdiction ?? '—' },
            { header: 'Created', cell: (s) => fmtDate(s.createdAt) },
            {
              header: 'Actions',
              cell: (s) => (
                <StablecoinActions
                  id={s.id}
                  lifecycleState={s.lifecycleState}
                  canManage={canManage}
                  canApprove={canApprove}
                />
              ),
              wrap: true,
            },
          ]}
        />
      )}
    </>
  );
}
