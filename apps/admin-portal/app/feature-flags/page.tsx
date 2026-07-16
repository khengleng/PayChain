import { apiGet } from '../../lib/api';
import { can, getSession } from '../../lib/session';
import { DataTable, Unavailable, fmtDate } from '../_components/DataTable';
import { FlagToggle } from '../_components/actions';

export const dynamic = 'force-dynamic';

interface GlobalFlag {
  key: string;
  enabled: boolean;
  seeded: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}
interface OverrideFlag {
  tenantId: string;
  tenant: string;
  key: string;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

function OnOff({ on }: { on: boolean }) {
  return <span className={`pill ${on ? 'good' : 'neutral'}`}>{on ? 'ON' : 'OFF'}</span>;
}

export default async function FeatureFlagsPage() {
  const data = await apiGet<{ global: GlobalFlag[]; overrides: OverrideFlag[] }>('/admin/flags');
  const anyOn = data?.global.some((f) => f.enabled) || data?.overrides.some((f) => f.enabled);
  const canWrite = can(getSession(), 'flags:write');

  return (
    <>
      <h1>Feature Flags</h1>
      <p className="subtitle">
        <span className="mono">stablecoin.*</span> flags · every production flag defaults OFF; an unseeded flag is effectively OFF (§36)
      </p>

      {!data ? (
        <Unavailable perm="flags:read" />
      ) : (
        <>
          <div className={`banner ${anyOn ? 'blocked' : 'ready'}`} style={{ marginBottom: 24 }}>
            <div className="big">{anyOn ? '⚠️ One or more flags are ON' : '✅ All production flags OFF'}</div>
            <div style={{ color: 'var(--muted)', marginTop: 6 }}>
              Global defaults resolve to OFF unless explicitly enabled behind approvals.
            </div>
          </div>

          <div className="section-title">Global defaults</div>
          <DataTable
            rows={data.global}
            rowKey={(f) => f.key}
            empty="No declared flags."
            columns={[
              { header: 'Flag', cell: (f) => <span className="mono" style={{ fontSize: 12 }}>{f.key}</span> },
              { header: 'Effective', cell: (f) => <OnOff on={f.enabled} /> },
              { header: 'Source', cell: (f) => (f.seeded ? 'DB row' : 'default (OFF)') },
              { header: 'Updated by', cell: (f) => f.updatedBy ?? '—' },
              { header: 'Updated', cell: (f) => fmtDate(f.updatedAt) },
              ...(canWrite
                ? [{ header: 'Set', cell: (f: GlobalFlag) => <FlagToggle flagKey={f.key} scope="GLOBAL" enabled={f.enabled} canWrite={canWrite} /> }]
                : []),
            ]}
          />

          <div className="section-title" style={{ marginTop: 28 }}>Tenant overrides</div>
          <DataTable
            rows={data.overrides}
            rowKey={(f, i) => `${f.tenant}:${f.key}:${i}`}
            empty="No per-tenant overrides — every tenant uses the global default."
            columns={[
              { header: 'Tenant', cell: (f) => f.tenant },
              { header: 'Flag', cell: (f) => <span className="mono" style={{ fontSize: 12 }}>{f.key}</span> },
              { header: 'Value', cell: (f) => <OnOff on={f.enabled} /> },
              { header: 'Updated by', cell: (f) => f.updatedBy ?? '—' },
              { header: 'Updated', cell: (f) => fmtDate(f.updatedAt) },
              ...(canWrite
                ? [{ header: 'Set', cell: (f: OverrideFlag) => <FlagToggle flagKey={f.key} scope={f.tenantId} enabled={f.enabled} canWrite={canWrite} /> }]
                : []),
            ]}
          />
        </>
      )}
    </>
  );
}
