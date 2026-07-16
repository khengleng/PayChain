'use client';

import { useState } from 'react';

export default function AccountPage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (next !== confirm) {
      setErr('New passwords do not match');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (res.ok) {
      setMsg('Password updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } else {
      setErr('Current password is incorrect, or the new one is too short (min 10).');
    }
  }

  return (
    <>
      <h1>Account</h1>
      <p className="subtitle">Change your password</p>
      <form className="form-card" onSubmit={submit}>
        {msg && <div className="ok-note">{msg}</div>}
        {err && <div className="login-error">{err}</div>}
        <label className="login-label">Current password</label>
        <input className="login-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <label className="login-label">New password</label>
        <input className="login-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={10} />
        <label className="login-label">Confirm new password</label>
        <input className="login-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  );
}
