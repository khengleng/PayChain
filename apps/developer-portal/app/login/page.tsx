'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/onboarding');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Invalid email or password');
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <div className="form-card" style={{ maxWidth: 460 }}>
        <h1>Partner sign in</h1>
        <p className="lead">Track your application and manage your integration.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="field-label">Password</label>
          <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="primary-btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p style={{ marginTop: 14 }}>New partner? <Link href="/register">Register</Link></p>
      </div>
    </main>
  );
}
