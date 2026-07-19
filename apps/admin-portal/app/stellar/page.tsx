import { apiGet } from '../../lib/api';

export const dynamic = 'force-dynamic';

interface StellarHealth {
  network: string;
  horizonConnected: boolean;
  latestLedger: number | null;
  issuerAccountAvailable: boolean | null;
  distributionAccountAvailable: boolean | null;
  signingServiceAvailable: boolean;
  assetCode: string;
}

function boolPill(v: boolean, on = 'Yes', off = 'No') {
  return <span className={`pill ${v ? 'good' : 'bad'}`}>{v ? on : off}</span>;
}

function accountPill(v: boolean | null) {
  if (v === null) return <span className="pill neutral">Not configured</span>;
  return <span className={`pill ${v ? 'good' : 'bad'}`}>{v ? 'On-chain' : 'Missing'}</span>;
}

export default async function StellarPage() {
  const h = await apiGet<StellarHealth>('/stellar/health');
  const isMainnet = h?.network === 'mainnet';

  return (
    <>
      <div className="head-row">
        <h1>Stellar</h1>
        {h && <span className="count">network · {h.network}</span>}
      </div>
      <p className="subtitle">On-chain network identity + health. Mainnet is fail-closed until the external signer is configured.</p>

      {!h ? (
        <p className="notice">Stellar health is unavailable — the API could not be reached.</p>
      ) : (
        <>
          <div className="tiles">
            <div className="tile">
              <div className="label">Network</div>
              <div className="value">{h.network}</div>
            </div>
            <div className="tile">
              <div className="label">Horizon</div>
              <div className="value">{boolPill(h.horizonConnected, 'Connected', 'Down')}</div>
            </div>
            <div className="tile">
              <div className="label">Latest ledger</div>
              <div className="value">{h.latestLedger ?? '—'}</div>
            </div>
            <div className="tile">
              <div className="label">Asset</div>
              <div className="value">{h.assetCode}</div>
            </div>
            <div className="tile">
              <div className="label">Issuer account</div>
              <div className="value">{accountPill(h.issuerAccountAvailable)}</div>
            </div>
            <div className="tile">
              <div className="label">Distribution account</div>
              <div className="value">{accountPill(h.distributionAccountAvailable)}</div>
            </div>
            <div className="tile">
              <div className="label">Signing service</div>
              <div className="value">{boolPill(h.signingServiceAvailable, 'Available', 'Unavailable')}</div>
            </div>
          </div>

          <p className="notice">
            {isMainnet
              ? 'Running on MAINNET. Real value moves are gated behind the readiness path and the external signer.'
              : `Running on ${h.network}. Mainnet stays fail-closed: a mainnet node refuses to boot on the in-process ` +
                'dev signer, so real value can never be signed by dev keys. The SEP-1 asset document is published at ' +
                '/.well-known/stellar.toml.'}
          </p>
        </>
      )}
    </>
  );
}
