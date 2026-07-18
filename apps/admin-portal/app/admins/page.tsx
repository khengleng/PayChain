'use client';

import { useCallback, useEffect, useState } from 'react';

interface Admin {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  attributes?: Record<string, unknown> | null;
}

/** Fallback only — the live list comes from /api/access-model so this cannot drift from roles.ts. */
const FALLBACK_ROLES = ['SUPER_ADMIN', 'SECURITY_ADMIN', 'OPERATIONS_ADMIN', 'COMPLIANCE_ADMIN', 'TREASURY_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR'];

/** Reads the ABAC tenant scope off an admin's attributes. Empty means unscoped (all tenants). */
function tenantScope(a: Admin): string[] {
  const t = (a.attributes as Record<string, unknown> | undefined)?.tenants;
  return Array.isArray(t) ? (t as string[]) : [];
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<string[]>(FALLBACK_ROLES);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('AUDITOR');
  const [scope, setScope] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admins');
    if (res.status === 403) {
      setError('You do not have permission to manage admins (requires admin:manage).');
      return;
    }
    if (res.ok) setAdmins(await res.json());
  }, []);

  useEffect(() => {
    void load();
    void fetch('/api/access-model')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m?.roles) setRoles(m.roles.map((r: { role: string }) => r.role));
      })
      .catch(() => undefined);
  }, [load]);

  /** Parses the comma-separated tenant scope input into ABAC attributes. */
  function scopeAttributes(raw: string): Record<string, unknown> {
    const tenants = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return { tenants };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');
    setError('');
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, attributes: scopeAttributes(scope) }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(`Created ${data.email} — temporary password: ${data.tempPassword}`);
      setEmail('');
      setScope('');
      void load();
    } else {
      setError(data.error ?? 'Could not create admin');
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setNotice('');
    setError('');
    const res = await fetch(`/api/admins/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) void load();
    else setError((await res.json()).error ?? 'Update failed');
  }

  async function action(id: string, kind: 'reset-password' | 'reset-mfa') {
    setNotice('');
    setError('');
    const res = await fetch(`/api/admins/${id}/${kind}`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) setNotice(kind === 'reset-password' ? `New temporary password: ${data.tempPassword}` : 'MFA reset — the admin will re-enroll on next login.');
    else setError('Action failed');
  }

  return (
    <>
      <h1>Admins</h1>
      <p className="subtitle">Manage platform administrators, roles, and access</p>

      {notice && <div className="ok-note">{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 600 }}>{error}</div>}

      <form className="form-card" style={{ maxWidth: 600, marginBottom: 24 }} onSubmit={create}>
        <div className="section-title" style={{ marginTop: 0 }}>Create admin</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="login-label">Email</label>
            <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="login-label">Role</label>
            <select className="login-input" value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="login-label">Tenant scope (ABAC)</label>
            <input
              className="login-input"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="blank = all tenants"
            />
          </div>
          <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }} type="submit">Create</button>
        </div>
        <p className="subtitle" style={{ fontSize: 12, marginBottom: 0 }}>
          Comma-separated tenant ids. Leaving this blank creates an <strong>unscoped</strong> admin
          who can act on every tenant — scope deliberately, not by default. See{' '}
          <a href="/access-control">Access Control</a> for what each role can do.
        </p>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Email</th><th>Role</th><th>Tenant scope (ABAC)</th><th>Status</th><th>MFA</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>
                  <select className="login-input" style={{ padding: '4px 8px', fontSize: 12 }} value={a.role} onChange={(e) => patch(a.id, { role: e.target.value })}>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    className="login-input"
                    style={{ padding: '4px 8px', fontSize: 12, minWidth: 160 }}
                    defaultValue={tenantScope(a).join(', ')}
                    placeholder="all tenants"
                    onBlur={(e) => {
                      const next = scopeAttributes(e.target.value);
                      if (JSON.stringify(next.tenants) !== JSON.stringify(tenantScope(a))) {
                        void patch(a.id, { attributes: next });
                      }
                    }}
                  />
                </td>
                <td><span className={`pill ${a.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>{a.status}</span></td>
                <td>{a.mfaEnabled ? '✓' : '—'}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn-sm" onClick={() => patch(a.id, { status: a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}>
                      {a.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-sm" onClick={() => action(a.id, 'reset-password')}>Reset password</button>
                    <button className="btn-sm" onClick={() => action(a.id, 'reset-mfa')}>Reset MFA</button>
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
