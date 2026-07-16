'use client';

import { useCallback, useEffect, useState } from 'react';

interface EventRow {
  id: string;
  action: string;
  scope: string | null;
  reason: string;
  actor: string;
  createdAt: string;
}

/**
 * Actions are grouped by whether they stop traffic today. DISABLE_MAINNET_WRITES is listed
 * separately and honestly: mainnet is excluded at config, so it clears an intent flag rather than
 * halting anything. Presenting it beside the live kill-switches would overstate it.
 */
const SUSPEND_ACTIONS = [
  { key: 'SUSPEND_MINTING', label: 'Suspend minting', help: 'Stops all stablecoin mint requests' },
  { key: 'SUSPEND_REDEMPTION', label: 'Suspend redemption', help: 'Stops stablecoin redemptions' },
  { key: 'SUSPEND_CONVERSION', label: 'Suspend conversion', help: 'Stops loyalty→stablecoin conversion' },
  { key: 'SUSPEND_TRANSFERS', label: 'Suspend transfers', help: 'Stops stablecoin transfers' },
];
const TARGETED_ACTIONS = [
  { key: 'FREEZE_WALLET', label: 'Freeze wallet', help: 'Wallet id — blocks sending AND receiving' },
  { key: 'FREEZE_ASSET', label: 'Freeze asset', help: 'Asset id' },
  { key: 'DISABLE_TENANT', label: 'Disable tenant', help: 'Tenant id' },
];

export default function EmergencyPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [canExecute, setCanExecute] = useState(false);
  const [action, setAction] = useState('SUSPEND_MINTING');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/emergency/events');
    if (res.ok) {
      const d = await res.json();
      setEvents(d.items ?? d ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
    void fetch('/api/access-model')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => setCanExecute(Boolean(m?.me?.permissions?.includes('emergency:execute'))))
      .catch(() => undefined);
  }, [load]);

  const needsTarget = TARGETED_ACTIONS.some((a) => a.key === action);

  async function execute() {
    setBusy(true);
    setNotice('');
    setError('');
    const res = await fetch('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason, ...(needsTarget ? { targetId } : {}) }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`${action} executed and recorded. Reason: "${reason}"`);
      setReason('');
      setTargetId('');
      setConfirming(false);
      void load();
    } else {
      setError(data.message ?? 'Action failed');
    }
    setBusy(false);
  }

  return (
    <>
      <h1>Emergency Controls</h1>
      <p className="subtitle">
        §37 break-glass. Every action requires a reason, is attributed to you, and is written to the
        append-only audit chain — never a silent block.
      </p>

      {notice && <div className="ok-note" style={{ maxWidth: 760 }}>{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 760 }}>{error}</div>}

      {!canExecute ? (
        <div className="notice">
          You do not hold <code>emergency:execute</code>. The event history below is read-only.
        </div>
      ) : (
        <div className="form-card" style={{ maxWidth: 760, marginBottom: 24 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Execute an action</div>

          <label className="login-label">Action</label>
          <select className="login-input" value={action} onChange={(e) => { setAction(e.target.value); setConfirming(false); }}>
            <optgroup label="Suspend (stops traffic immediately)">
              {SUSPEND_ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </optgroup>
            <optgroup label="Targeted">
              {TARGETED_ACTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </optgroup>
            <optgroup label="Intent record only">
              <option value="DISABLE_MAINNET_WRITES">Disable mainnet writes</option>
            </optgroup>
          </select>
          <p className="subtitle" style={{ fontSize: 12, marginTop: 4 }}>
            {[...SUSPEND_ACTIONS, ...TARGETED_ACTIONS].find((a) => a.key === action)?.help ??
              'Mainnet is already excluded at config (STELLAR_NETWORK admits only testnet/futurenet), so this clears an intent flag rather than stopping traffic.'}
          </p>

          {needsTarget && (
            <>
              <label className="login-label">Target id</label>
              <input className="login-input" value={targetId} onChange={(e) => setTargetId(e.target.value)} required />
            </>
          )}

          <label className="login-label" style={{ marginTop: 10 }}>Reason (required, permanent)</label>
          <input className="login-input" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. incident-123: suspected compromise of merchant credentials" required />

          {!confirming ? (
            <button className="login-btn" style={{ width: 'auto', marginTop: 12, padding: '11px 18px' }}
              disabled={!reason || (needsTarget && !targetId)}
              onClick={() => setConfirming(true)}>
              Continue
            </button>
          ) : (
            <div className="notice" style={{ marginTop: 12 }}>
              <strong>Confirm: {action}{needsTarget ? ` on ${targetId}` : ''}</strong>
              <div style={{ fontSize: 13, marginTop: 4, color: 'var(--muted)' }}>
                This takes effect immediately and cannot be un-recorded.
              </div>
              <div className="row-actions" style={{ marginTop: 8 }}>
                <button className="btn-sm" onClick={execute} disabled={busy}>
                  {busy ? 'Executing…' : 'Execute now'}
                </button>
                <button className="btn-sm" onClick={() => setConfirming(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="section-title">Event history</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Action</th><th>Scope / target</th><th>Reason</th><th>Actor</th></tr></thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>No emergency actions recorded.</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ fontSize: 12 }}>{new Date(e.createdAt).toLocaleString()}</td>
                <td><span className="mono" style={{ fontSize: 11 }}>{e.action}</span></td>
                <td style={{ fontSize: 12 }}>{e.scope ?? '—'}</td>
                <td className="wrap" style={{ fontSize: 12 }}>{e.reason}</td>
                <td style={{ fontSize: 12 }}>{e.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
