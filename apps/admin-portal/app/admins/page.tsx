'use client';

import { useEffect, useState } from 'react';

interface Admin {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
}

const ROLES = ['SUPER_ADMIN', 'SECURITY_ADMIN', 'OPERATIONS_ADMIN', 'COMPLIANCE_ADMIN', 'TREASURY_ADMIN', 'SUPPORT_ADMIN', 'AUDITOR'];

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('AUDITOR');

  async function load() {
    const res = await fetch('/api/admins');
    if (res.status === 403) {
      setError('You do not have permission to manage admins (requires admin:manage).');
      return;
    }
    if (res.ok) setAdmins(await res.json());
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setNotice('');
    setError('');
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice(`Created ${data.email} — temporary password: ${data.tempPassword}`);
      setEmail('');
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
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }} type="submit">Create</button>
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Email</th><th>Role</th><th>Status</th><th>MFA</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>
                  <select className="login-input" style={{ padding: '4px 8px', fontSize: 12 }} value={a.role} onChange={(e) => patch(a.id, { role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
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
