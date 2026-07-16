'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="brand" style={{ fontSize: 22, marginBottom: 4 }}>
          Pay<span>Chain</span>
        </div>
        <div className="brand-sub" style={{ marginBottom: 20 }}>Reset your password</div>
        {sent ? (
          <>
            <div className="ok-note">If an account exists for that email, a reset link has been sent (valid 15 minutes).</div>
            <div className="center-links">
              <Link className="link" href="/login">Back to sign in</Link>
            </div>
          </>
        ) : (
          <>
            <label className="login-label">Email</label>
            <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="center-links">
              <Link className="link" href="/login">Back to sign in</Link>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
