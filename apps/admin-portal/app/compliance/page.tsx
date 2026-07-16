import { apiGet } from '../../lib/api';
import { DataTable, StatusPill, Unavailable, fmtDate } from '../_components/DataTable';

export const dynamic = 'force-dynamic';

interface AlertRow {
  id: string;
  tenant: string;
  ruleKey: string;
  severity: string;
  status: string;
  subjectType: string;
  subjectReference: string;
  reason: string;
  holdApplied: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

export default async function CompliancePage() {
  const data = await apiGet<{ items: AlertRow[] }>('/admin/compliance/alerts');
  const openCount = data?.items.filter((a) => a.status === 'OPEN').length ?? 0;

  return (
    <>
      <div className="head-row">
        <h1>Compliance</h1>
        {data && <span className="count">{data.items.length} alert(s) · {openCount} open</span>}
      </div>
      <p className="subtitle">
        Transaction-monitoring alerts · CRITICAL may apply an audited hold (never a silent block) · provider is a mock until the pilot gate
      </p>

      {!data ? (
        <Unavailable perm="compliance:read" />
      ) : (
        <DataTable
          rows={data.items}
          rowKey={(a) => a.id}
          empty="No monitoring alerts raised."
          columns={[
            { header: 'Tenant', cell: (a) => a.tenant },
            { header: 'Rule', cell: (a) => <span className="mono" style={{ fontSize: 12 }}>{a.ruleKey}</span> },
            { header: 'Severity', cell: (a) => <StatusPill value={a.severity} /> },
            { header: 'Status', cell: (a) => <StatusPill value={a.status} /> },
            { header: 'Subject', cell: (a) => `${a.subjectType} · ${a.subjectReference}` },
            { header: 'Reason', wrap: true, cell: (a) => a.reason },
            { header: 'Hold', cell: (a) => (a.holdApplied ? <span style={{ color: 'var(--err)' }}>Held</span> : '—') },
            { header: 'Raised', cell: (a) => fmtDate(a.createdAt) },
          ]}
        />
      )}
    </>
  );
}
