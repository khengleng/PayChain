'use client';

import { useCallback, useEffect, useState } from 'react';

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
interface TenantRow { id: string; name: string; status: string }

const ASSET_TYPES = [
  'LOYALTY_POINT', 'CASHBACK', 'PROMOTIONAL_CREDIT', 'MERCHANT_CREDIT',
  'GIFT_CARD', 'VOUCHER', 'COUPON', 'MEMBERSHIP_CREDIT', 'TICKET', 'CARBON_CREDIT',
];

function YesNo({ v }: { v: boolean }) {
  return <span style={{ color: v ? 'var(--ok)' : 'var(--muted)' }}>{v ? 'Yes' : 'No'}</span>;
}

export default function AssetsPage() {
  const [items, setItems] = useState<AssetRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [assetCode, setAssetCode] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('LOYALTY_POINT');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/assets');
    if (res.ok) setItems(((await res.json()) as { items: AssetRow[] }).items ?? []);
  }, []);

  useEffect(() => {
    void load();
    void fetch('/api/tenants').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const list: TenantRow[] = d?.items ?? [];
      setTenants(list);
      if (list[0]) setTenantId(list[0].id);
    }).catch(() => undefined);
    void fetch('/api/access-model').then((r) => (r.ok ? r.json() : null))
      .then((m) => setCanWrite(Boolean(m?.me?.permissions?.includes('asset:write'))))
      .catch(() => undefined);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice(''); setError('');
    const res = await fetch(`/api/tenants/${tenantId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetCode, assetName, assetType }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`Created ${data.assetCode} in DRAFT — activate it before value can be issued.`);
      setAssetCode(''); setAssetName('');
      void load();
    } else setError(data.message ?? 'Could not create asset');
    setBusy(false);
  }

  async function activate(id: string) {
    setNotice(''); setError('');
    const res = await fetch(`/api/assets/${id}/activate`, { method: 'POST' });
    if (res.ok) { setNotice('Asset activated — it can now issue value.'); void load(); }
    else setError((await res.json().catch(() => ({}))).message ?? 'Activation failed');
  }

  return (
    <>
      <div className="head-row">
        <h1>Assets</h1>
        <span className="count">{items.length} asset(s)</span>
      </div>
      <p className="subtitle">
        Loyalty and value instruments issued on-chain · each asset gets its own Stellar issuer account
      </p>

      {notice && <div className="ok-note" style={{ maxWidth: 700 }}>{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 700 }}>{error}</div>}

      {canWrite && (
        <form className="form-card" style={{ maxWidth: 760, marginBottom: 24 }} onSubmit={create}>
          <div className="section-title" style={{ marginTop: 0 }}>Create an asset for a tenant</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: 190 }}>
              <label className="login-label">Tenant</label>
              <select className="login-input" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label className="login-label">Code</label>
              <input className="login-input" value={assetCode} onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                placeholder="PTS" maxLength={12} pattern="[A-Za-z0-9]{1,12}" required />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label className="login-label">Name</label>
              <input className="login-input" value={assetName} onChange={(e) => setAssetName(e.target.value)}
                placeholder="Loyalty Points" required />
            </div>
            <div style={{ minWidth: 180 }}>
              <label className="login-label">Type</label>
              <select className="login-input" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
              type="submit" disabled={busy || !tenantId}>
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
          <p className="subtitle" style={{ fontSize: 12, marginBottom: 0 }}>
            Stablecoin types are deliberately absent: those follow the §22 lifecycle with six approval
            gates, not a form. Assets start in DRAFT and issue nothing until activated.
          </p>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Tenant</th><th>Type</th><th>Status</th>
              <th>Transferable</th><th>Redeemable</th>{canWrite && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>No assets yet.</td></tr>
            )}
            {items.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.assetCode}</td>
                <td>{a.assetName}</td>
                <td style={{ fontSize: 12 }}>{a.tenant}</td>
                <td style={{ fontSize: 11 }}>{a.assetType}</td>
                <td><span className={`pill ${a.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>{a.status}</span></td>
                <td><YesNo v={a.transferability} /></td>
                <td><YesNo v={a.redeemability} /></td>
                {canWrite && (
                  <td>
                    {a.status === 'DRAFT' && (
                      <button className="btn-sm" onClick={() => activate(a.id)}>Activate</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
