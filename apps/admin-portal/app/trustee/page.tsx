'use client';

import { useEffect, useState } from 'react';

interface Authorization {
  id: string;
  tenant: string;
  assetId: string;
  amount: string;
  reference: string;
  authorizationId: string;
  status: string;
  expiresAt: string | null;
  receivedAt: string;
}
interface Deposit {
  id: string;
  tenant: string;
  depositId: string;
  reference: string;
  amount: string;
  currency: string | null;
  status: string;
  receivedAt: string;
}
interface Snapshot {
  id: string;
  tenant: string;
  assetId: string;
  reserveBalance: string;
  trusteeSnapshotId: string | null;
  takenAt: string;
}
interface Activity {
  authorizations: Authorization[];
  deposits: Deposit[];
  reserveSnapshots: Snapshot[];
}

const AUTH_PILL: Record<string, string> = { VALID: 'IN_PROGRESS', CONSUMED: 'PASSED', EXPIRED: 'BLOCKED' };

export default function TrusteePage() {
  const [data, setData] = useState<Activity | null>(null);

  useEffect(() => {
    void fetch('/api/trustee').then((r) => (r.ok ? r.json() : null)).then(setData).catch(() => undefined);
  }, []);

  const a = data ?? { authorizations: [], deposits: [], reserveSnapshots: [] };

  return (
    <>
      <div className="head-row">
        <h1>Trustee</h1>
        <span className="count">{a.authorizations.length} authorizations · {a.deposits.length} deposits</span>
      </div>
      <p className="subtitle">
        Signed events received from the trustee: mint authorizations, cleared deposits (funding), and
        trustee-corroborated reserve snapshots. Verified against the trustee&apos;s published keys before recording.
      </p>

      <div className="section-title">Mint authorizations</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Tenant</th><th>Asset</th><th>Amount</th><th>Mint request</th><th>Status</th><th>Expires</th></tr></thead>
          <tbody>
            {a.authorizations.length === 0 && <tr><td colSpan={7} style={{ color: 'var(--muted)' }}>None.</td></tr>}
            {a.authorizations.map((r) => (
              <tr key={r.id}>
                <td style={{ fontSize: 12 }}>{new Date(r.receivedAt).toLocaleString()}</td>
                <td style={{ fontSize: 12 }}>{r.tenant}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.assetId}</td>
                <td className="mono">{r.amount}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.reference}</td>
                <td><span className={`pill ${AUTH_PILL[r.status] ?? 'IN_PROGRESS'}`}>{r.status}</span></td>
                <td style={{ fontSize: 11 }}>{r.expiresAt ? new Date(r.expiresAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">Cleared deposits</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Tenant</th><th>Deposit</th><th>Funding ref</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {a.deposits.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>None.</td></tr>}
            {a.deposits.map((r) => (
              <tr key={r.id}>
                <td style={{ fontSize: 12 }}>{new Date(r.receivedAt).toLocaleString()}</td>
                <td style={{ fontSize: 12 }}>{r.tenant}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.depositId}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.reference}</td>
                <td className="mono">{r.amount} {r.currency ?? ''}</td>
                <td><span className="pill PASSED">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">Trustee reserve snapshots</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Tenant</th><th>Asset</th><th>Attested balance</th><th>Snapshot id</th></tr></thead>
          <tbody>
            {a.reserveSnapshots.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>None.</td></tr>}
            {a.reserveSnapshots.map((r) => (
              <tr key={r.id}>
                <td style={{ fontSize: 12 }}>{new Date(r.takenAt).toLocaleString()}</td>
                <td style={{ fontSize: 12 }}>{r.tenant}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.assetId}</td>
                <td className="mono">{r.reserveBalance}</td>
                <td className="mono" style={{ fontSize: 11 }}>{r.trusteeSnapshotId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
