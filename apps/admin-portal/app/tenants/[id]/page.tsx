'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface RetailerTenantRow {
  id: string;
  name: string;
  type: 'RETAILER';
  parentTenantId: string | null;
  parentTenantName: string | null;
  status: string;
  createdAt: string;
  childTenants: number;
  apiClients: number;
  wallets: number;
  assets: number;
  wholesalerTenantId: string;
  wholesalerTenantName: string;
  requestCount24h: number;
  errorCount24h: number;
  failedAuthAttempts24h: number;
  lastApiRequestAt: string | null;
  lastFailedAuthAt: string | null;
}

interface WholesalerRetailersView {
  wholesaler: {
    id: string;
    name: string;
    type: 'WHOLESALER';
    parentTenantId: string | null;
    parentTenantName: string | null;
    status: string;
    createdAt: string;
    childTenants: number;
    apiClients: number;
    wallets: number;
    assets: number;
  };
  summary: {
    retailers: number;
    apiClients: number;
    wallets: number;
    assets: number;
    requestCount24h: number;
    errorCount24h: number;
    failedAuthAttempts24h: number;
  };
  items: RetailerTenantRow[];
}

export default function WholesalerTenantPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<WholesalerRetailersView | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch(`/api/tenants/${params.id}/retailers`);
    const body = await res.json().catch(() => null);
    if (res.ok) {
      setData(body as WholesalerRetailersView);
      setError('');
    } else {
      setData(null);
      setError((body as { message?: string; error?: string } | null)?.message ?? 'Retailer management unavailable');
    }
    setLoaded(true);
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    setError('');
    const res = await fetch(`/api/tenants/${params.id}/retailers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`Created retailer "${body.name}" under ${data?.wholesaler.name ?? 'wholesaler'}.`);
      setName('');
      void load();
    } else {
      setError(body.message ?? body.error ?? 'Could not create retailer');
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
    else setError((await res.json().catch(() => ({}))).message ?? 'Retailer status change failed');
  }

  if (!loaded) return <p className="subtitle">Loading downstream retailers…</p>;
  if (!data) {
    return (
      <>
        <div className="head-row">
          <h1>Retailers</h1>
          <Link className="btn-sm" href="/tenants">← Tenants</Link>
        </div>
        <div className="login-error" style={{ maxWidth: 700 }}>{error || 'Retailer management unavailable'}</div>
      </>
    );
  }

  return (
    <>
      <div className="head-row">
        <div>
          <h1>{data.wholesaler.name}</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Downstream retailer management for this wholesaler tenant
          </p>
        </div>
        <div className="row-actions">
          <Link className="btn-sm" href="/tenants">← Tenants</Link>
          <Link className="btn-sm" href={`/tenants/${params.id}/clients`}>Wholesaler API credentials</Link>
        </div>
      </div>

      {notice && <div className="ok-note">{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 700 }}>{error}</div>}

      <div className="grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3>Retailers</h3>
          <p className="mono">{data.summary.retailers}</p>
        </div>
        <div className="card">
          <h3>API Clients</h3>
          <p className="mono">{data.summary.apiClients}</p>
        </div>
        <div className="card">
          <h3>Wallets</h3>
          <p className="mono">{data.summary.wallets}</p>
        </div>
        <div className="card">
          <h3>Assets</h3>
          <p className="mono">{data.summary.assets}</p>
        </div>
        <div className="card">
          <h3>24h API Requests</h3>
          <p className="mono">{data.summary.requestCount24h}</p>
        </div>
        <div className="card">
          <h3>24h Errors</h3>
          <p className="mono">{data.summary.errorCount24h}</p>
        </div>
        <div className="card">
          <h3>24h Auth Failures</h3>
          <p className="mono">{data.summary.failedAuthAttempts24h}</p>
        </div>
      </div>

      <form className="form-card" style={{ maxWidth: 640, marginBottom: 24 }} onSubmit={create}>
        <div className="section-title" style={{ marginTop: 0 }}>Add retailer</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label className="login-label">Retail business name</label>
            <input
              className="login-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Angkor Market"
              minLength={2}
              required
            />
          </div>
          <button
            className="login-btn"
            style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
            type="submit"
            disabled={busy}
          >
            {busy ? 'Creating…' : 'Create retailer'}
          </button>
        </div>
        <p className="subtitle" style={{ fontSize: 12, marginBottom: 0 }}>
          Each retailer is isolated as its own tenant under {data.wholesaler.name}. Issue its API
          credentials after provisioning.
        </p>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>API clients</th>
              <th style={{ textAlign: 'right' }}>Wallets</th>
              <th style={{ textAlign: 'right' }}>Assets</th>
              <th style={{ textAlign: 'right' }}>24h Req / Err</th>
              <th>Last activity</th>
              <th style={{ textAlign: 'right' }}>24h Auth Fail</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ color: 'var(--muted)' }}>
                  No retailers have been provisioned under this wholesaler yet.
                </td>
              </tr>
            )}
            {data.items.map((retailer) => (
              <tr key={retailer.id}>
                <td>
                  {retailer.name}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{retailer.id}</div>
                </td>
                <td>
                  <span className={`pill ${retailer.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>
                    {retailer.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>{retailer.apiClients}</td>
                <td style={{ textAlign: 'right' }}>{retailer.wallets}</td>
                <td style={{ textAlign: 'right' }}>{retailer.assets}</td>
                <td style={{ textAlign: 'right' }}>
                  {retailer.requestCount24h} / {retailer.errorCount24h}
                </td>
                <td>
                  {retailer.lastApiRequestAt ? new Date(retailer.lastApiRequestAt).toLocaleString() : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {retailer.failedAuthAttempts24h}
                  {retailer.lastFailedAuthAt ? (
                    <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(retailer.lastFailedAuthAt).toLocaleString()}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div className="row-actions">
                    <Link className="btn-sm" href={`/tenants/${retailer.id}/clients`}>API credentials</Link>
                    <button
                      className="btn-sm"
                      onClick={() => setStatus(retailer.id, retailer.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                    >
                      {retailer.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
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
