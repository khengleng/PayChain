'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Phase = 'password' | 'mfa';

export default function LoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState('');
  const [enrolled, setEnrolled] = useState(true);
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError('Invalid email or password');
        return;
      }
      const data = (await res.json()) as { enrolled: boolean; challengeToken: string };
      setChallenge(data.challengeToken);
      setEnrolled(data.enrolled);
      if (!data.enrolled) {
        // First-time: fetch a TOTP secret + QR to enroll.
        const setup = await fetch('/api/mfa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challengeToken: data.challengeToken }),
        });
        if (setup.ok) {
          const s = (await setup.json()) as { secret: string; qr: string };
          setSecret(s.secret);
          setQr(s.qr);
        }
      }
      setPhase('mfa');
    } catch {
      setError('Could not reach the server');
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: challenge, code }),
      });
      if (!res.ok) {
        setError('Invalid authentication code');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Could not reach the server');
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      {phase === 'password' ? (
        <form className="login-card" onSubmit={submitPassword}>
          <div className="brand" style={{ fontSize: 22, marginBottom: 4, justifyContent: 'center' }}>
            <Image src="/brand/paychain-icon.svg" alt="" className="brand-mark" width={30} height={30} />
            <span className="brand-word">Pay<span>Chain</span></span>
          </div>
          <div className="brand-sub" style={{ marginBottom: 24 }}>Super Admin Portal — sign in</div>
          {error && <div className="login-error">{error}</div>}
          <label className="login-label">Email</label>
          <input className="login-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="login-label">Password</label>
          <input className="login-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Continue'}
          </button>
          <div className="center-links">
            <a className="link" href="/forgot">Forgot password?</a>
          </div>
        </form>
      ) : (
        <form className="login-card" onSubmit={submitCode}>
          <div className="brand" style={{ fontSize: 22, marginBottom: 4, justifyContent: 'center' }}>
            <Image src="/brand/paychain-icon.svg" alt="" className="brand-mark" width={30} height={30} />
            <span className="brand-word">Pay<span>Chain</span></span>
          </div>
          <div className="brand-sub" style={{ marginBottom: 20 }}>
            {enrolled ? 'Two-factor authentication' : 'Set up two-factor authentication'}
          </div>
          {error && <div className="login-error">{error}</div>}

          {!enrolled && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0 }}>
                Scan with Google Authenticator / Authy, or enter the key manually.
              </p>
              {qr && (
                <Image
                  src={qr}
                  alt="MFA QR code"
                  width={180}
                  height={180}
                  unoptimized
                  style={{ borderRadius: 8, background: '#fff', padding: 6 }}
                />
              )}
              {secret && <div className="mono" style={{ marginTop: 10, wordBreak: 'break-all', fontSize: 12, color: 'var(--muted)' }}>{secret}</div>}
            </div>
          )}

          <label className="login-label">6-digit code</label>
          <input
            className="login-input"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
          <button className="login-btn" type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Verifying…' : enrolled ? 'Verify' : 'Enable & sign in'}
          </button>
        </form>
      )}
    </div>
  );
}
