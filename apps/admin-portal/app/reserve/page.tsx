'use client';

import { useCallback, useEffect, useState } from 'react';

interface AccountRow {
  id: string;
  tenant: string;
  assetId: string;
  label: string;
  custodianReference: string | null;
  bankReference: string | null;
  balance: string;
  status: string;
  trusteeCorroborated?: boolean;
  attestedBalance?: string | null;
  attestedAt?: string | null;
}
interface MovementRow {
  id: string;
  tenant: string;
  tenantId: string;
  account: string;
  direction: string;
  amount: string;
  reference: string | null;
  status: string;
  createdBy: string | null;
  approvedBy: string | null;
  balanceAfter: string | null;
  createdAt: string;
}
interface TenantRow { id: string; name: string }
interface TieOutRow {
  assetCode: string;
  ledgerReserve: string;
  onChainLiability: string;
  trusteeAttestedFiat: string | null;
  ledgerRatio: string;
  targetRatio: string;
  status: 'RECONCILED' | 'SHORTFALL' | 'MISMATCH' | 'UNATTESTED';
  discrepancies: string[];
}

const TIE_OUT_PILL: Record<TieOutRow['status'], string> = {
  RECONCILED: 'PASSED',
  SHORTFALL: 'BLOCKED',
  MISMATCH: 'IN_PROGRESS',
  UNATTESTED: 'IN_PROGRESS',
};

export default function ReservePage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [tieOuts, setTieOuts] = useState<TieOutRow[]>([]);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [perms, setPerms] = useState<string[]>([]);
  const [form, setForm] = useState({ tenantId: '', reserveAccountId: '', direction: 'CREDIT', amount: '', reference: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const canManage = perms.includes('reserve:manage');
  const canApprove = perms.includes('reserve:approve');

  const load = useCallback(async () => {
    const [a, m, t] = await Promise.all([
      fetch('/api/reserve'),
      fetch('/api/reserve/movements'),
      fetch('/api/reserve/tie-out'),
    ]);
    if (a.ok) setAccounts(((await a.json()) as { items: AccountRow[] }).items ?? []);
    if (m.ok) setMovements(((await m.json()) as { items: MovementRow[] }).items ?? []);
    if (t.ok) setTieOuts(((await t.json()) as { items: TieOutRow[] }).items ?? []);
  }, []);

  useEffect(() => {
    void load();
    void fetch('/api/tenants').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const list: TenantRow[] = d?.items ?? [];
      setTenants(list);
      if (list[0]) setForm((f) => ({ ...f, tenantId: list[0]!.id }));
    }).catch(() => undefined);
    void fetch('/api/access-model').then((r) => (r.ok ? r.json() : null))
      .then((m) => setPerms(m?.me?.permissions ?? [])).catch(() => undefined);
  }, [load]);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setNotice(''); setError('');
    const res = await fetch(`/api/tenants/${form.tenantId}/reserve/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reserveAccountId: form.reserveAccountId,
        direction: form.direction,
        amount: form.amount,
        ...(form.reference ? { reference: form.reference } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice('Requested. No money has moved — a different operator must approve it.');
      setForm((f) => ({ ...f, amount: '', reference: '' }));
      void load();
    } else setError(data.message ?? 'Request failed');
    setBusy(false);
  }

  async function act(id: string, path: 'approve' | 'reject') {
    setNotice(''); setError('');
    const body = path === 'reject' ? JSON.stringify({ reason: 'Rejected from console' }) : undefined;
    const res = await fetch(`/api/reserve/movements/${id}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...(body ? { body } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { setNotice(path === 'approve' ? 'Applied — the reserve balance has moved.' : 'Rejected.'); void load(); }
    else setError(data.message ?? 'Action failed');
  }

  async function runTieOutCheck() {
    setBusy(true); setNotice(''); setError('');
    const res = await fetch('/api/reserve/tie-out/check', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setNotice(`Checked ${data.checked ?? 0} coin(s) · ${data.openExceptions ?? 0} with an open reconciliation exception.`);
      void load();
    } else setError(data.message ?? 'Tie-out check failed');
    setBusy(false);
  }

  const pending = movements.filter((m) => m.status === 'PENDING_APPROVAL');

  return (
    <>
      <div className="head-row">
        <h1>Reserve</h1>
        <span className="count">{accounts.length} account(s) · {pending.length} pending</span>
      </div>
      <p className="subtitle">
        Assets backing issued tokens · movements are maker-checker gated: requesting moves nothing
        until a different operator approves
      </p>

      {notice && <div className="ok-note" style={{ maxWidth: 760 }}>{notice}</div>}
      {error && <div className="login-error" style={{ maxWidth: 760 }}>{error}</div>}

      <div className="notice" style={{ maxWidth: 860 }}>
        <strong>Reserve balances are self-asserted today.</strong> They change only through the
        approved movements below — there is no custodian or bank feed, so these figures state what
        an operator recorded, not what a third party confirms. Proof of reserve requires an
        independent source (e.g. a Bakong balance feed) and an attestation workflow; neither exists
        yet. Present these numbers accordingly.
      </div>

      <div className="head-row">
        <div className="section-title" style={{ marginBottom: 0 }}>3-way tie-out (per coin)</div>
        {canManage && (
          <button className="btn-sm" onClick={runTieOutCheck} disabled={busy}>
            {busy ? 'Checking…' : 'Run check'}
          </button>
        )}
      </div>
      <p className="subtitle" style={{ fontSize: 12, marginTop: -4 }}>
        Internal ledger reserve ↔ on-chain liability (supply × unit value) ↔ trustee-attested fiat.
        RECONCILED = all three agree; SHORTFALL = reserve below the target; MISMATCH = ledger and
        trustee disagree; UNATTESTED = no fresh trustee attestation. "Run check" records the outcome —
        a discrepancy opens a reconciliation exception (visible under Reconciliation).
      </p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Coin</th><th>Ledger reserve</th><th>On-chain liability</th><th>Trustee fiat</th><th>Ratio</th><th>Target</th><th>Status</th><th>Discrepancies</th></tr></thead>
          <tbody>
            {tieOuts.length === 0 && (
              <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>No active coins to reconcile.</td></tr>
            )}
            {tieOuts.map((t) => (
              <tr key={t.assetCode}>
                <td className="mono">{t.assetCode}</td>
                <td className="mono">{t.ledgerReserve}</td>
                <td className="mono">{t.onChainLiability}</td>
                <td className="mono" style={{ fontSize: 12 }}>{t.trusteeAttestedFiat ?? '—'}</td>
                <td className="mono" style={{ fontSize: 12 }}>{t.ledgerRatio}</td>
                <td className="mono" style={{ fontSize: 12 }}>{t.targetRatio}</td>
                <td><span className={`pill ${TIE_OUT_PILL[t.status]}`}>{t.status}</span></td>
                <td style={{ fontSize: 11, color: 'var(--muted)' }}>{t.discrepancies.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">Reserve accounts</div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Label</th><th>Tenant</th><th>Balance</th><th>Trustee</th><th>Attested</th><th>Custodian ref</th><th>Bank ref</th><th>Status</th></tr></thead>
          <tbody>
            {accounts.length === 0 && (
              <tr><td colSpan={8} style={{ color: 'var(--muted)' }}>No reserve accounts registered.</td></tr>
            )}
            {accounts.map((r) => (
              <tr key={r.id}>
                <td>{r.label}<div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{r.id}</div></td>
                <td style={{ fontSize: 12 }}>{r.tenant}</td>
                <td className="mono">{r.balance}</td>
                <td>
                  {r.trusteeCorroborated
                    ? <span className="pill PASSED" title={r.attestedAt ? `As of ${new Date(r.attestedAt).toLocaleString()}` : ''}>Corroborated</span>
                    : <span className="pill" style={{ color: 'var(--muted)' }}>Self-asserted</span>}
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{r.attestedBalance ?? '—'}</td>
                <td style={{ fontSize: 12 }}>{r.custodianReference ?? '—'}</td>
                <td style={{ fontSize: 12 }}>{r.bankReference ?? '—'}</td>
                <td><span className={`pill ${r.status === 'ACTIVE' ? 'PASSED' : 'BLOCKED'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && accounts.length > 0 && (
        <form className="form-card" style={{ maxWidth: 860, marginTop: 20 }} onSubmit={request}>
          <div className="section-title" style={{ marginTop: 0 }}>Request a movement</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ minWidth: 170 }}>
              <label className="login-label">Tenant</label>
              <select className="login-input" value={form.tenantId}
                onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 200 }}>
              <label className="login-label">Reserve account</label>
              <select className="login-input" value={form.reserveAccountId}
                onChange={(e) => setForm((f) => ({ ...f, reserveAccountId: e.target.value }))} required>
                <option value="">Select…</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label className="login-label">Direction</label>
              <select className="login-input" value={form.direction}
                onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}>
                <option value="CREDIT">CREDIT</option>
                <option value="DEBIT">DEBIT</option>
              </select>
            </div>
            <div style={{ width: 140 }}>
              <label className="login-label">Amount</label>
              <input className="login-input" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="1000.00" required />
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <label className="login-label">Reference</label>
              <input className="login-input" value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="bank ref / note" />
            </div>
            <button className="login-btn" style={{ width: 'auto', marginTop: 0, padding: '11px 18px' }}
              type="submit" disabled={busy}>{busy ? 'Requesting…' : 'Request'}</button>
          </div>
        </form>
      )}

      <div className="section-title">Movements</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>When</th><th>Account</th><th>Direction</th><th>Amount</th><th>Status</th>
              <th>Requested by</th><th>Approved by</th><th>Balance after</th>
              {canApprove && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {movements.length === 0 && (
              <tr><td colSpan={9} style={{ color: 'var(--muted)' }}>No movements recorded.</td></tr>
            )}
            {movements.map((m) => (
              <tr key={m.id}>
                <td style={{ fontSize: 12 }}>{new Date(m.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: 12 }}>{m.account}</td>
                <td><span className="mono" style={{ fontSize: 11 }}>{m.direction}</span></td>
                <td className="mono">{m.amount}</td>
                <td><span className={`pill ${m.status === 'APPLIED' ? 'PASSED' : m.status === 'REJECTED' ? 'BLOCKED' : 'IN_PROGRESS'}`}>{m.status}</span></td>
                <td style={{ fontSize: 11 }}>{m.createdBy ?? '—'}</td>
                <td style={{ fontSize: 11 }}>{m.approvedBy ?? '—'}</td>
                <td className="mono" style={{ fontSize: 12 }}>{m.balanceAfter ?? '—'}</td>
                {canApprove && (
                  <td>
                    {m.status === 'PENDING_APPROVAL' && (
                      <div className="row-actions">
                        <button className="btn-sm" onClick={() => act(m.id, 'approve')}>Approve</button>
                        <button className="btn-sm" onClick={() => act(m.id, 'reject')}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="subtitle" style={{ fontSize: 12 }}>
        You cannot approve a movement you requested — the service refuses on identity, not just on
        this button being hidden. A debit that would take the reserve negative is refused.
      </p>
    </>
  );
}
