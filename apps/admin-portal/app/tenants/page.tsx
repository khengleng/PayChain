'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface TenantRow {
  id: string;
  name: string;
  type: 'DIRECT' | 'WHOLESALER' | 'RETAILER';
  parentTenantId: string | null;
  parentTenantName: string | null;
  status: string;
  childTenants: number;
  apiClients: number;
  wallets: number;
  assets: number;
  createdAt: string;
}

export default function TenantsPage() {
  const [items, setItems] = useState<TenantRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [myRole, setMyRole] = useState<string>('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'DIRECT' | 'WHOLESALER' | 'RETAILER'>('DIRECT');
  const [parentTenantId, setParentTenantId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/tenants');
    if (res.ok) setItems(((await res.json()) as { items: TenantRow[] }).items ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    // Drive the form off the caller's real permissions rather than guessing: hiding a control
    // they can use is as bad as showing one they cannot.
    void fetch('/api/access-model')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        setCanWrite(Boolean(m?.me?.permissions?.includes('tenant:write')));
        setMyRole(m?.me?.role ?? '');
      })
      .catch(() => undefined);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    const res = await fetch('/api/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, parentTenantId: parentTenantId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`Created tenant "${data.name}" — issue its API credentials to let it integrate.`);
      setName('');
      setType(myRole === 'WHOLESALE_ADMIN' ? 'RETAILER' : 'DIRECT');
      setParentTenantId('');
      void load();
    } else {
      setError(data.message ?? data.error ?? 'Could not create tenant');
    }
    setBusy(false);
  }

  async function setStatus(id: string, status: string) {
    setNotice('');
    setError('');
    const res = await fetch(`/api/tenants/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) void load();
    else setError((await res.json().catch(() => ({}))).message ?? 'Status change failed');
  }

  return (
    <>
      <div className="head-row">
        <h1>Tenants</h1>
        <span className="count">{items.length} tenant(s)</span>
      </div>
      <p className="subtitle">
        Client organizations that consume PayChain · tenant isolation enforced platform-wide
      </p>

      {notice && <div className="ok-note">{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 640 }}>{error}</div>}

      {canWrite && (
        <form className="form-card" style={{ maxWidth: 640, marginBottom: 24 }} onSubmit={create}>
        <div className="section-title" style={{ marginTop: 0 }}>Provision a tenant</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label className="login-label">Organization name</label>
              <input
                className="login-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. PayKH"
                minLength={2}
                required
              />
            </div>
            <div style={{ minWidth: 180 }}>
              <label className="login-label">Tenant type</label>
              <select
                className="login-input"
                value={type}
                onChange={(e) => setType(e.target.value as never)}
                disabled={myRole === 'WHOLESALE_ADMIN'}
              >
                <option value="DIRECT">DIRECT</option>
                <option value="WHOLESALER">WHOLESALER</option>
                <option value="RETAILER">RETAILER</option>
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="login-label">Parent tenant</label>
              <select className="login-input" value={parentTenantId} onChange={(e) => setParentTenantId(e.target.value)} disabled={type !== 'RETAILER'}>
                <option value="">None</option>
                {items
                  .filter((item) => item.type === 'WHOLESALER')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.type})
                    </option>
                  ))}
              </select>
            </div>
            <button
              className="login-btn"
              style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
              type="submit"
              disabled={busy}
            >
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
          <p className="subtitle" style={{ fontSize: 12, marginBottom: 0 }}>
            Use `WHOLESALER` for a channel partner like PayKH and create `RETAILER` tenants beneath it.
            A tenant cannot do anything until it holds API credentials — issue them from its row below.
          </p>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Parent</th><th>Status</th><th style={{ textAlign: 'right' }}>Children</th><th style={{ textAlign: 'right' }}>API clients</th>
              <th style={{ textAlign: 'right' }}>Wallets</th><th style={{ textAlign: 'right' }}>Assets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && loaded && (
              <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>No tenants provisioned yet.</td></tr>
            )}
            {items.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.name}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{t.id}</div>
                </td>
                <td><span className="mono">{t.type}</span></td>
                <td>{t.parentTenantName ?? '—'}</td>
                <td><span className={`pill ${t.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>{t.status}</span></td>
                <td style={{ textAlign: 'right' }}>{t.childTenants}</td>
                <td style={{ textAlign: 'right' }}>{t.apiClients}</td>
                <td style={{ textAlign: 'right' }}>{t.wallets}</td>
                <td style={{ textAlign: 'right' }}>{t.assets}</td>
                <td>
                  <div className="row-actions">
                    <Link className="btn-sm" href={`/tenants/${t.id}/clients`}>API credentials</Link>
                    {t.type === 'WHOLESALER' && (
                      <Link className="btn-sm" href={`/tenants/${t.id}`}>Manage retailers</Link>
                    )}
                    {canWrite && (
                      <button
                        className="btn-sm"
                        onClick={() => setStatus(t.id, t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                      >
                        {t.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
