'use client';

import { useCallback, useEffect, useState } from 'react';

interface Gate {
  key: string;
  category: string;
  title: string;
  status: string;
  evidence?: string | null;
  mandatory: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}
interface ReadinessResponse {
  summary: {
    productionReady: boolean;
    mandatoryTotal: number;
    mandatoryPassed: number;
    blockedBy: string[];
  };
  gates: Gate[];
}
interface FlagsResponse {
  global: Array<{ key: string; enabled: boolean }>;
}

const STATUSES = ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'WAIVED'];

export default function ReadinessPage() {
  const [data, setData] = useState<ReadinessResponse | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [canEnableMainnet, setCanEnableMainnet] = useState(false);
  const [mainnetEnabled, setMainnetEnabled] = useState(false);
  const [mainnetBusy, setMainnetBusy] = useState(false);
  const [mainnetNotice, setMainnetNotice] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [readinessRes, flagsRes] = await Promise.all([
      fetch('/api/readiness'),
      fetch('/api/flags'),
    ]);
    if (readinessRes.ok) {
      setData(await readinessRes.json());
    }
    if (flagsRes.ok) {
      const flags = (await flagsRes.json()) as FlagsResponse;
      setMainnetEnabled(Boolean(flags.global.find((f) => f.key === 'stablecoin.mainnet.enabled')?.enabled));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
    void fetch('/api/access-model')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        const permissions: string[] = m?.me?.permissions ?? [];
        setCanWrite(permissions.includes('readiness:write'));
        setCanEnableMainnet(permissions.includes('mainnet:enable'));
      })
      .catch(() => undefined);
  }, [load]);

  function beginEdit(g: Gate) {
    setEditing(g.key);
    setStatus(g.status);
    setEvidence(g.evidence ?? '');
    setError('');
  }

  async function save(key: string) {
    setError('');
    const res = await fetch(`/api/readiness/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, evidence: evidence || undefined }),
    });
    if (res.ok) {
      setEditing(null);
      void load();
    } else {
      setError((await res.json().catch(() => ({}))).message ?? 'Could not update gate');
    }
  }

  async function enableMainnet() {
    setMainnetBusy(true);
    setMainnetNotice('');
    setError('');
    const res = await fetch('/api/mainnet/enable', { method: 'POST' });
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      setMainnetNotice('Mainnet writes enabled and recorded in the audit chain.');
      await load();
    } else {
      setError(payload.message ?? payload.error ?? 'Could not enable mainnet writes');
    }
    setMainnetBusy(false);
  }

  if (!loaded) return <><h1>Production Readiness</h1><p className="subtitle">Loading…</p></>;

  if (!data) {
    return (
      <>
        <h1>Production Readiness</h1>
        <div className="notice">
          Live readiness data is unavailable — your role may lack <code>readiness:read</code>.
        </div>
      </>
    );
  }

  const { summary, gates } = data;
  return (
    <>
      <h1>Production Readiness</h1>
      <p className="subtitle">§43 gates · evidence-based · blocks mainnet until all mandatory pass</p>

      <div className={`banner ${summary.productionReady ? 'ready' : 'blocked'}`}>
        <div className="big">
          {summary.productionReady ? '✅ Production-ready' : '⛔ Production / mainnet BLOCKED'}
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>
          {summary.mandatoryPassed}/{summary.mandatoryTotal} mandatory gates passed
          {summary.blockedBy.length > 0 && <> · blocked by: {summary.blockedBy.join(', ')}</>}
        </div>
      </div>

      {(canEnableMainnet || mainnetEnabled) && (
        <div className="form-card" style={{ maxWidth: 780, marginBottom: 20 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Mainnet writes</div>
          <p className="subtitle" style={{ marginTop: 0 }}>
            This is the only path that can turn <code>stablecoin.mainnet.enabled</code> on. It
            stays blocked until every mandatory readiness gate passes.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`pill ${mainnetEnabled ? 'PASSED' : 'BLOCKED'}`}>
              {mainnetEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
            {canEnableMainnet && (
              <button
                className="btn-sm"
                disabled={mainnetBusy || mainnetEnabled || !summary.productionReady}
                onClick={enableMainnet}
                title={!summary.productionReady ? 'Every mandatory readiness gate must pass first' : undefined}
              >
                {mainnetBusy ? 'Enabling…' : mainnetEnabled ? 'Mainnet enabled' : 'Enable mainnet writes'}
              </button>
            )}
          </div>
          {!summary.productionReady && canEnableMainnet && (
            <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
              This action remains locked until the blocked mandatory gates are resolved.
            </div>
          )}
          {mainnetNotice && <div className="ok-note" style={{ marginTop: 12 }}>{mainnetNotice}</div>}
        </div>
      )}

      {error && <div className="login-error" style={{ maxWidth: 700 }}>{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Gate</th><th>Category</th><th>Status</th>
              <th className="wrap">Evidence</th><th>Verified by</th><th>Mandatory</th>
              {canWrite && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {gates.map((g) => (
              <tr key={g.key}>
                <td>
                  {g.title}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{g.key}</div>
                </td>
                <td>{g.category}</td>
                <td>
                  {editing === g.key ? (
                    <select className="login-input" style={{ padding: '4px 8px', fontSize: 12 }}
                      value={status} onChange={(e) => setStatus(e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`pill ${g.status}`}>{g.status}</span>
                  )}
                </td>
                <td className="wrap" style={{ color: 'var(--muted)' }}>
                  {editing === g.key ? (
                    <textarea className="login-input" rows={3} style={{ fontSize: 12, minWidth: 260 }}
                      value={evidence} onChange={(e) => setEvidence(e.target.value)}
                      placeholder="What was verified, by whom, and where is the artifact?" />
                  ) : (
                    g.evidence ?? '—'
                  )}
                </td>
                <td style={{ fontSize: 12 }}>
                  {g.verifiedBy ?? '—'}
                  {g.verifiedAt && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(g.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td>{g.mandatory ? 'Yes' : 'No'}</td>
                {canWrite && (
                  <td>
                    <div className="row-actions">
                      {editing === g.key ? (
                        <>
                          <button className="btn-sm" onClick={() => save(g.key)}>Save</button>
                          <button className="btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn-sm" onClick={() => beginEdit(g)}>Update</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canWrite && (
        <div className="notice" style={{ marginTop: 16 }}>
          <strong>Gate changes are permanent and attributed.</strong> Every update is written to the
          append-only audit chain with your name and timestamp — the database rejects edits and
          deletions, so a gate marked <code>PASSED</code> cannot later be quietly walked back. Write
          evidence a third party could check: what was verified, by whom, and where the artifact
          lives. A gate is a claim you are making, not a checkbox.
          <div style={{ marginTop: 6, color: 'var(--muted)' }}>
            Known gap: one holder of <code>readiness:write</code> can set any gate with no second
            approver, and evidence is free text rather than an attached artifact.
          </div>
        </div>
      )}
    </>
  );
}
