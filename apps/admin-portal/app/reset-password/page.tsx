'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (next !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: next }),
    });
    setLoading(false);
    if (res.ok) setDone(true);
    else setErr('This reset link is invalid or has expired.');
  }

  return (
    <form className="login-card" onSubmit={submit}>
      <div className="brand" style={{ fontSize: 22, marginBottom: 4 }}>
        Pay<span>Chain</span>
      </div>
      <div className="brand-sub" style={{ marginBottom: 20 }}>Choose a new password</div>
      {done ? (
        <>
          <div className="ok-note">Password reset. You can sign in now.</div>
          <div className="center-links"><Link className="link" href="/login">Go to sign in</Link></div>
        </>
      ) : !token ? (
        <div className="login-error">Missing or invalid reset link.</div>
      ) : (
        <>
          {err && <div className="login-error">{err}</div>}
          <label className="login-label">New password</label>
          <input className="login-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={10} />
          <label className="login-label">Confirm password</label>
          <input className="login-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={10} />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </button>
        </>
      )}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-wrap">
      <Suspense fallback={<div className="login-card">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
