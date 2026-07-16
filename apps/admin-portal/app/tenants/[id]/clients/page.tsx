'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface ClientRow {
  id: string;
  clientId: string;
  name: string;
  scopes: string[];
  status: string;
  createdBy: string | null;
  createdAt: string;
}

interface Issued {
  clientId: string;
  clientSecret: string;
  name: string;
  warning: string;
}

interface ScopeCatalog {
  scopes: string[];
  sensitive: string[];
  presets: { loyaltyIntegration: string[] };
}

export default function TenantClientsPage({ params }: { params: { id: string } }) {
  const tenantId = params.id;
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [catalog, setCatalog] = useState<ScopeCatalog | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/tenants/${tenantId}/clients`);
    if (res.ok) setRows(await res.json());
    else if (res.status === 403) setError('You do not have permission to view API clients (requires client:read).');
  }, [tenantId]);

  useEffect(() => {
    void load();
    void fetch('/api/client-scopes')
      .then((r) => (r.ok ? r.json() : null))
      .then((c: ScopeCatalog | null) => {
        setCatalog(c);
        if (c) setSelected(c.presets.loyaltyIntegration);
      })
      .catch(() => undefined);
    void fetch('/api/access-model')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => setCanWrite(Boolean(m?.me?.permissions?.includes('client:write'))))
      .catch(() => undefined);
  }, [load]);

  function toggle(scope: string) {
    setSelected((s) => (s.includes(scope) ? s.filter((x) => x !== scope) : [...s, scope]));
  }

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setIssued(null);
    const res = await fetch(`/api/tenants/${tenantId}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, scopes: selected, ...(prefix ? { clientIdPrefix: prefix } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setIssued(data as Issued);
      setName('');
      void load();
    } else {
      setError(data.message ?? 'Could not issue credentials');
    }
    setBusy(false);
  }

  async function act(id: string, path: string, body?: unknown) {
    setError('');
    const res = await fetch(`/api/clients/${id}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.message ?? 'Action failed');
    if (path === 'rotate-secret') setIssued(data as Issued);
    void load();
  }

  return (
    <>
      <div className="head-row">
        <h1>API Credentials</h1>
        <Link className="btn-sm" href="/tenants">← Tenants</Link>
      </div>
      <p className="subtitle">
        Credentials a tenant uses to call the API · secrets are hashed and shown once, never stored
      </p>

      {error && <div className="login-error" style={{ maxWidth: 700 }}>{error}</div>}

      {issued && (
        <div className="ok-note" style={{ maxWidth: 700 }}>
          <strong>Save this secret now — it cannot be shown again.</strong>
          <div style={{ marginTop: 8 }}>
            <div className="login-label">Client ID</div>
            <div className="mono" style={{ fontSize: 13 }}>{issued.clientId}</div>
            <div className="login-label" style={{ marginTop: 8 }}>Client secret</div>
            <div className="mono" style={{ fontSize: 13, wordBreak: 'break-all' }}>{issued.clientSecret}</div>
          </div>
          <p style={{ fontSize: 12, marginBottom: 0, marginTop: 8 }}>{issued.warning}</p>
          <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => setIssued(null)}>
            I have saved it
          </button>
        </div>
      )}

      {canWrite && catalog && (
        <form className="form-card" style={{ maxWidth: 700, marginBottom: 24 }} onSubmit={issue}>
          <div className="section-title" style={{ marginTop: 0 }}>Issue credentials</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="login-label">Label</label>
              <input className="login-input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PayKH Loyalty Integration" required />
            </div>
            <div style={{ width: 160 }}>
              <label className="login-label">ID prefix (optional)</label>
              <input className="login-input" value={prefix} onChange={(e) => setPrefix(e.target.value)}
                placeholder="paykh" pattern="[a-z0-9-]{1,16}" />
            </div>
          </div>

          <div className="login-label" style={{ marginTop: 12 }}>Scopes</div>
          <p className="subtitle" style={{ fontSize: 12, marginTop: 0 }}>
            Defaults to the loyalty-integration preset. Scopes marked <strong>sensitive</strong> let a
            credential move or authorize value beyond ordinary loyalty traffic — grant deliberately.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {catalog.scopes.map((s) => {
              const on = selected.includes(s);
              const sensitive = catalog.sensitive.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggle(s)}
                  className={`pill ${on ? (sensitive ? 'BLOCKED' : 'PASSED') : ''}`}
                  style={{ cursor: 'pointer', border: 0, fontSize: 11, opacity: on ? 1 : 0.45 }}
                  title={sensitive ? 'Sensitive scope' : undefined}>
                  {s}{sensitive ? ' ⚠' : ''}
                </button>
              );
            })}
          </div>
          <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
            type="submit" disabled={busy || selected.length === 0}>
            {busy ? 'Issuing…' : 'Issue credentials'}
          </button>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Label</th><th>Client ID</th><th>Scopes</th><th>Status</th><th>Issued by</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>No credentials issued for this tenant yet.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="mono" style={{ fontSize: 12 }}>{c.clientId}</td>
                <td style={{ fontSize: 11, color: 'var(--muted)' }}>{c.scopes.length} scope(s)</td>
                <td><span className={`pill ${c.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>{c.status}</span></td>
                <td style={{ fontSize: 12 }}>{c.createdBy ?? '—'}</td>
                <td>
                  {canWrite && (
                    <div className="row-actions">
                      <button className="btn-sm" onClick={() => act(c.id, 'rotate-secret')}>Rotate secret</button>
                      <button className="btn-sm" onClick={() =>
                        act(c.id, 'status', { status: c.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE' })}>
                        {c.status === 'ACTIVE' ? 'Revoke' : 'Reactivate'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="subtitle" style={{ fontSize: 12 }}>
        Rotating issues a new secret and kills the old one immediately; the client id and scopes stay
        the same, so the partner changes one environment variable rather than re-onboarding.
      </p>
    </>
  );
}
