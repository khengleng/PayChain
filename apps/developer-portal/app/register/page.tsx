'use client';

import Link from 'next/link';
import { useState } from 'react';

const TYPES = [
  { value: 'LOYALTY', label: 'Loyalty (points wallets, issue/redeem)' },
  { value: 'TRUSTEE', label: 'Trustee / verifier (read-only reserve & readiness)' },
  { value: 'WHOLESALER', label: 'Wholesaler (multi-tier reseller)' },
  { value: 'RETAILER', label: 'Retailer (under a wholesaler)' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    orgName: '',
    contactName: '',
    contactEmail: '',
    password: '',
    integrationType: 'LOYALTY',
    requestedParentTenantId: '',
    useCase: '',
    website: '', // honeypot
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload: Record<string, unknown> = { ...form };
    if (!payload.requestedParentTenantId) delete payload.requestedParentTenantId;
    if (!payload.website) delete payload.website;
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setReference(data.reference ?? 'submitted');
    else setError(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Registration failed');
    setBusy(false);
  }

  if (reference) {
    return (
      <main className="wrap">
        <div className="form-card" style={{ maxWidth: 560 }}>
          <h1>Application received</h1>
          <p className="lead">
            Thanks — your partner application is in review. We&apos;ve emailed a confirmation. Your
            reference is <span className="mono">{reference}</span>.
          </p>
          <p>
            <Link className="primary-btn" href="/login">Sign in to track status</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap">
      <div className="form-card" style={{ maxWidth: 620 }}>
        <h1>Become a PayChain partner</h1>
        <p className="lead">
          Register your organisation to integrate with PayChain. After review, an operator provisions
          your tenant and API credentials, and you complete onboarding here.
        </p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field-label">Organisation name</label>
          <input className="field-input" value={form.orgName} onChange={(e) => set('orgName', e.target.value)} required />

          <label className="field-label">Contact name</label>
          <input className="field-input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} required />

          <label className="field-label">Contact email</label>
          <input className="field-input" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} required />

          <label className="field-label">Password (for your onboarding login)</label>
          <input className="field-input" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} minLength={10} required />

          <label className="field-label">Integration type</label>
          <select className="field-input" value={form.integrationType} onChange={(e) => set('integrationType', e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {form.integrationType === 'RETAILER' && (
            <>
              <label className="field-label">Parent wholesaler tenant id</label>
              <input className="field-input" value={form.requestedParentTenantId} onChange={(e) => set('requestedParentTenantId', e.target.value)} placeholder="UUID of your wholesaler" required />
            </>
          )}

          <label className="field-label">What do you want to build?</label>
          <textarea className="field-input" rows={4} value={form.useCase} onChange={(e) => set('useCase', e.target.value)} minLength={10} required />

          {/* honeypot: hidden from humans */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}
            value={form.website} onChange={(e) => set('website', e.target.value)} />

          <button className="primary-btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
        </form>
        <p style={{ marginTop: 14 }}>Already applied? <Link href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
