'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface PartnerApplication {
  reference: string;
  orgName: string;
  contactName: string;
  integrationType: string;
  status: string;
  rejectionReason: string | null;
  clientId: string | null;
}

const STEPS = ['PENDING', 'APPROVED', 'PROVISIONED'] as const;
const STEP_LABEL: Record<string, string> = {
  PENDING: 'Submitted · in review',
  APPROVED: 'Approved',
  PROVISIONED: 'Provisioned',
};

const CHECKLIST = [
  { title: 'Get your credentials', body: 'Generate your API secret below (shown once), pair it with your client id.' },
  { title: 'Create a wallet', body: 'Call POST /api/v1/wallets to create your first wallet.', href: '/integration' },
  { title: 'Receive webhooks', body: 'Register a webhook endpoint and verify signatures.', href: '/webhooks' },
  { title: 'Test in sandbox', body: 'Exercise issue/redeem flows against testnet.', href: '/api-reference' },
  { title: 'Go live', body: 'Confirm readiness with your PayChain contact.', href: '/status' },
];

export default function OnboardingClient({ application }: { application: PartnerApplication }) {
  const router = useRouter();
  const [secret, setSecret] = useState<{ clientId: string; clientSecret: string; warning: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const provisioned = application.status === 'PROVISIONED';
  const rejected = application.status === 'REJECTED';
  const currentStep = rejected ? -1 : STEPS.indexOf(application.status as (typeof STEPS)[number]);

  async function generateSecret() {
    setBusy(true);
    setError('');
    const res = await fetch('/api/partner/rotate', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setSecret(data);
    else setError(data.message ?? 'Could not generate a secret');
    setBusy(false);
  }

  async function logout() {
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="wrap">
      <div className="head-row">
        <h1>Onboarding · {application.orgName}</h1>
        <button className="link-btn" onClick={logout}>Sign out</button>
      </div>
      <p className="lead">
        {application.integrationType} integration · reference <span className="mono">{application.reference}</span>
      </p>

      {rejected ? (
        <div className="form-error" style={{ maxWidth: 620 }}>
          Your application was not accepted. {application.rejectionReason}
        </div>
      ) : (
        <ol className="timeline">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= currentStep ? 'done' : ''}>
              <span className="dot" /> {STEP_LABEL[s]}
            </li>
          ))}
        </ol>
      )}

      {provisioned && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h3>Credentials</h3>
          <p>Client id: <span className="mono">{application.clientId}</span></p>
          {!secret ? (
            <>
              <p className="lead">Generate your API secret. It is shown once and never stored.</p>
              <button className="primary-btn" onClick={generateSecret} disabled={busy}>
                {busy ? 'Generating…' : 'Generate API secret'}
              </button>
              {error && <div className="form-error">{error}</div>}
            </>
          ) : (
            <div className="secret-box">
              <div><span className="field-label">CLIENT ID</span><div className="mono">{secret.clientId}</div></div>
              <div><span className="field-label">CLIENT SECRET</span><div className="mono">{secret.clientSecret}</div></div>
              <p className="warn">{secret.warning}</p>
            </div>
          )}
        </div>
      )}

      <h3 style={{ marginTop: 26 }}>Integration checklist</h3>
      <div className="grid">
        {CHECKLIST.map((c, i) => (
          <div className="tile" key={c.title}>
            <div className="tag">Step {i + 1}</div>
            <strong>{c.title}</strong>
            <p>{c.body}</p>
            {c.href && <Link href={c.href}>Open guide →</Link>}
          </div>
        ))}
      </div>
    </main>
  );
}
