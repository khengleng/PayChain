'use client';

import { useCallback, useEffect, useState } from 'react';

interface AuditRow {
  seq: string | null;
  id: string;
  tenant: string | null;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  correlationId: string | null;
  createdAt: string;
  entryHash: string | null;
}

interface Verification {
  ok: boolean;
  verified: number;
  unchainedLegacy: number;
  headHash?: string;
  brokenAtSeq?: string;
  reason?: string;
}

const EMPTY = { from: '', to: '', actor: '', action: '', resourceId: '' };

export default function AuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filters, setFilters] = useState(EMPTY);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const qs = useCallback((extra: Record<string, string> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, ...extra })) if (v) p.set(k, v);
    return p.toString();
  }, [filters]);

  const load = useCallback(async (append = false, cur?: string) => {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/audit?${qs(cur ? { cursor: cur } : {})}`);
    if (res.status === 403) setError('You do not have permission to read the audit trail (requires audit:read).');
    else if (res.ok) {
      const data = (await res.json()) as { items: AuditRow[]; nextCursor: string | null; hasMore: boolean };
      setRows((prev) => (append ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
    setBusy(false);
  }, [qs]);

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function verify() {
    setBusy(true);
    setVerification(null);
    const res = await fetch('/api/audit/verify');
    if (res.ok) setVerification(await res.json());
    else setError('Verification failed');
    setBusy(false);
  }

  return (
    <>
      <div className="head-row">
        <h1>Audit Logs</h1>
        <div className="row-actions">
          <button className="btn-sm" onClick={verify} disabled={busy}>Verify chain</button>
          <a className="btn-sm" href={`/api/audit/export.csv?${qs()}`}>Export CSV</a>
          <a className="btn-sm" href={`/api/audit/export?${qs()}`} target="_blank" rel="noreferrer">Evidence pack (JSON)</a>
        </div>
      </div>
      <p className="subtitle">
        Append-only, hash-chained record of privileged and financial actions. The database rejects
        UPDATE and DELETE; each entry commits to the one before it, so any edit, deletion or
        reordering breaks the chain and is detectable.
      </p>

      {error && <div className="login-error" style={{ maxWidth: 700 }}>{error}</div>}

      {verification && (
        <div className={verification.ok ? 'ok-note' : 'login-error'} style={{ maxWidth: 820 }}>
          <strong>{verification.ok ? 'Chain intact' : 'CHAIN BROKEN'}</strong>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {verification.verified} entries verified
            {verification.unchainedLegacy > 0 && ` · ${verification.unchainedLegacy} pre-chain legacy entries (written before the chain existed — not tampering)`}
          </div>
          {verification.ok ? (
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Head hash <span className="mono">{verification.headHash}</span>
              <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                Record this hash externally. An auditor holding an earlier head can prove nothing was
                revised since — that is what makes the chain meaningful.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Broken at seq {verification.brokenAtSeq}: {verification.reason}
            </div>
          )}
        </div>
      )}

      <div className="form-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {([
            ['from', 'From', 'date'],
            ['to', 'To', 'date'],
            ['actor', 'Actor', 'text'],
            ['action', 'Action', 'text'],
            ['resourceId', 'Resource id', 'text'],
          ] as const).map(([key, label, type]) => (
            <div key={key} style={{ minWidth: type === 'date' ? 150 : 170 }}>
              <label className="login-label">{label}</label>
              <input
                className="login-input"
                type={type}
                value={filters[key]}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
            onClick={() => void load()} disabled={busy}>
            {busy ? 'Loading…' : 'Search'}
          </button>
          <button className="btn-sm" onClick={() => { setFilters(EMPTY); }}>Clear</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seq</th><th>When</th><th>Actor</th><th>Action</th>
              <th>Resource</th><th>Tenant</th><th>Correlation</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !busy && (
              <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>No audit entries match.</td></tr>
            )}
            {rows.map((l) => (
              <tr key={l.id}>
                <td className="mono" style={{ fontSize: 11 }} title={l.entryHash ?? 'unchained legacy entry'}>
                  {l.seq ?? '—'}
                </td>
                <td style={{ fontSize: 12 }}>{new Date(l.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: 12 }}>{l.actor}</td>
                <td><span className="mono" style={{ fontSize: 11 }}>{l.action}</span></td>
                <td style={{ fontSize: 12 }}>
                  {l.resourceType}{l.resourceId ? ` · ${l.resourceId.slice(0, 8)}…` : ''}
                </td>
                <td style={{ fontSize: 12 }}>{l.tenant ?? '—'}</td>
                <td className="mono" style={{ fontSize: 11 }}>{l.correlationId?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button className="btn-sm" style={{ marginTop: 12 }} disabled={busy}
          onClick={() => void load(true, cursor ?? undefined)}>
          {busy ? 'Loading…' : 'Load more'}
        </button>
      )}
      <p className="subtitle" style={{ fontSize: 12 }}>
        Paginated by sequence, not timestamp, so new entries cannot shift rows between pages.
        Exporting is itself audited — reading the trail is a cross-tenant disclosure.
      </p>
    </>
  );
}
