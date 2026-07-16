'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Small client-side action controls used inside the (server-rendered) admin tables. Each
// posts to a portal /api route (which proxies to the API with the admin's JWT), then refreshes
// the server component so the table reflects the new state. Buttons are only rendered when the
// server passed canWrite=true; the API remains the real authorization boundary regardless.

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function run(url: string) {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? data.message ?? 'Action failed');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setErr('Network error');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, err, run };
}

export function WalletActions({ id, status, canWrite }: { id: string; status: string; canWrite: boolean }) {
  const { busy, err, run } = useAction();
  if (!canWrite) return <span style={{ color: 'var(--muted)' }}>—</span>;
  const frozen = status === 'FROZEN';
  return (
    <div className="row-actions">
      {frozen ? (
        <button className="btn-sm" disabled={busy} onClick={() => run(`/api/wallets/${id}/unfreeze`)}>
          {busy ? '…' : 'Unfreeze'}
        </button>
      ) : (
        <button className="btn-sm" disabled={busy} onClick={() => run(`/api/wallets/${id}/freeze`)}>
          {busy ? '…' : 'Freeze'}
        </button>
      )}
      {err && <span style={{ color: 'var(--err)', fontSize: 11 }}>{err}</span>}
    </div>
  );
}

export function TreasuryActions({ id, status, canWrite }: { id: string; status: string; canWrite: boolean }) {
  const { busy, err, run } = useAction();
  if (status !== 'PENDING_APPROVAL') return <span style={{ color: 'var(--muted)' }}>—</span>;
  if (!canWrite) return <span style={{ color: 'var(--muted)' }}>awaiting approval</span>;
  return (
    <div className="row-actions">
      <button className="btn-sm" disabled={busy} onClick={() => run(`/api/treasury/${id}/approve`)}>
        {busy ? '…' : 'Approve'}
      </button>
      <button className="btn-sm" disabled={busy} onClick={() => run(`/api/treasury/${id}/reject`)}>
        Reject
      </button>
      {err && <span style={{ color: 'var(--err)', fontSize: 11 }}>{err}</span>}
    </div>
  );
}

export function FlagToggle({
  flagKey,
  scope,
  enabled,
  canWrite,
}: {
  flagKey: string;
  scope: string;
  enabled: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // The mainnet flag can never be turned ON via a raw toggle (§0.2) — the API enforces this
  // too; disabling the enable action here just avoids a guaranteed error round-trip.
  const mainnetLock = flagKey === 'stablecoin.mainnet.enabled' && !enabled;

  async function toggle() {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, scope, enabled: !enabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error ?? data.message ?? 'Failed');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canWrite) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <button className="btn-sm" disabled={busy || mainnetLock} title={mainnetLock ? 'Use the readiness-gated mainnet enable path' : undefined} onClick={toggle}>
        {busy ? '…' : enabled ? 'Disable' : 'Enable'}
      </button>
      {err && <span style={{ color: 'var(--err)', fontSize: 11 }}>{err}</span>}
    </span>
  );
}
