const AUTH_SNIPPET = `curl -s -X POST https://api.paychain.cambobia.com/api/v1/oauth/token \\
  -H 'content-type: application/json' \\
  -d '{"client_id":"...","client_secret":"...","grant_type":"client_credentials"}'
# -> { "access_token": "...", "expires_in": 3600 }
# Then: Authorization: Bearer <access_token> on every call.`;

const EVENTS_SNIPPET = `| Your event      | Call                        | Idempotency-Key            |
|-----------------|-----------------------------|----------------------------|
| Customer signup | POST /wallets               | paykh:wallet:{customerId}  |
| Purchase reward | POST /assets/{id}/earn      | paykh:earn:{eventId}       |
| Referral reward | POST /assets/{id}/issue     | paykh:referral:{eventId}   |
| Scratch game    | POST /assets/{id}/issue     | paykh:scratch:{playId}     |
| Redemption      | POST /assets/{id}/redeem    | paykh:redeem:{eventId}     |
| Gifting         | POST /assets/{id}/transfer  | paykh:transfer:{eventId}   |`;

const WEBHOOK_SNIPPET = `// Signature = HMAC-SHA256(secret, \`\${timestamp}.\${rawBody}\`), hex, prefixed "sha256=".
import { verifyWebhook } from '@paychain/sdk';

app.post('/webhooks/paychain', express.raw({ type: '*/*' }), (req, res) => {
  const ok = verifyWebhook(
    process.env.PAYCHAIN_WEBHOOK_SECRET,
    req.body.toString('utf8'),          // the RAW body — parsing first breaks the signature
    req.headers['x-paychain-signature'],
    req.headers['x-paychain-timestamp'],
  );
  if (!ok) return res.status(401).end();

  // Delivery is at-least-once. Dedupe on deliveryId before you act.
  res.status(200).end();
});`;

function Row({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <tr>
      <td className="mono" style={{ whiteSpace: 'nowrap', paddingRight: 16 }}>{label}</td>
      <td style={{ color: tone === 'warn' ? '#b45309' : undefined }}>{value}</td>
    </tr>
  );
}

export default function Integration() {
  return (
    <div className="wrap">
      <h1>Integration guide</h1>
      <p className="lead">
        How an existing app becomes a PayChain client. Written for the PayKH loyalty integration;
        the pattern is the same for any tenant. Your app is <strong>not</strong> modified into
        PayChain — it calls it.
      </p>

      <h2>Before you write code — read this</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        PayChain runs on <strong>Stellar testnet</strong> with <strong>development-grade signing
        keys</strong>. Two consequences that change how you design the integration:
      </p>
      <table style={{ fontSize: 14, marginBottom: 16 }}>
        <tbody>
          <Row
            label="Testnet resets"
            value="Stellar periodically resets testnet. Every account and balance is wiped. Your ledger must stay authoritative — PayChain runs in shadow alongside it, never as the system of record."
            tone="warn"
          />
          <Row
            label="Dev-grade keys"
            value="Custody is not production-grade. Do not migrate real customer value onto PayChain balances. Cutover is gated on key management (HSM/MPC) and is not available today."
            tone="warn"
          />
        </tbody>
      </table>
      <p className="lead" style={{ fontSize: 14 }}>
        This is a sandbox integration that produces a real digital trace — real customers, real
        events, real chain transactions. It is not a production ledger migration.
      </p>

      <h2>1. Credentials</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Ask the PayChain operator for a <span className="mono">client_id</span> /{' '}
        <span className="mono">client_secret</span> for your tenant, plus your{' '}
        <span className="mono">LOYALTY_ASSET_ID</span>. Secrets are shown once. Keep them
        server-side — never in a mobile or browser client.
      </p>
      <pre>
        <code>{AUTH_SNIPPET}</code>
      </pre>
      <p className="lead" style={{ fontSize: 14 }}>
        The client needs exactly these scopes for a loyalty integration — a missing one surfaces as
        a <span className="mono">403</span> on the call that needs it, not at token time:
      </p>
      <table style={{ fontSize: 14, marginBottom: 16 }}>
        <tbody>
          <Row label="wallet.write" value="Create customer wallets." />
          <Row label="wallet.read" value="Read a wallet and its balances." />
          <Row label="asset.read" value="Read the loyalty asset." />
          <Row label="asset.issue" value="Issue points, and earn via the rules engine." />
          <Row label="asset.transfer" value="Transfer AND redeem — redeem shares this scope." />
        </tbody>
      </table>

      <h2>2. Map each customer to a wallet</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        One wallet per customer, created idempotently with{' '}
        <span className="mono">paykh:wallet:{'{customerId}'}</span>. Safe to call on every login.
      </p>

      <h2>3. Dual-write every money event</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Send the <span className="mono">Idempotency-Key</span> header derived from{' '}
        <strong>your own event id</strong> — never a random value, or a retry becomes a second
        award. This is what makes at-least-once queues safe.
      </p>
      <pre>
        <code>{EVENTS_SNIPPET}</code>
      </pre>
      <p className="lead" style={{ fontSize: 14 }}>
        A <span className="mono">409</span> means the same key was reused with a{' '}
        <strong>different payload</strong> — investigate, do not blindly retry.
      </p>

      <h2>4. Handle webhooks</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Submission is not confirmation. A write returns before the chain confirms; subscribe to{' '}
        <span className="mono">asset.issued</span>, <span className="mono">asset.transferred</span>,{' '}
        <span className="mono">asset.redeemed</span> and{' '}
        <span className="mono">asset.burned</span> for the confirmed state.
      </p>
      <pre>
        <code>{WEBHOOK_SNIPPET}</code>
      </pre>

      <h2>5. Reconcile, then advance</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Compare your ledger against PayChain on a schedule and escalate any mismatch. Advance only
        when comparisons stay clean over a sustained window:
      </p>
      <ol className="lead" style={{ fontSize: 14 }}>
        <li>Shadow — PayChain called in the background, your ledger authoritative.</li>
        <li>Read-only balance shown alongside your own.</li>
        <li>Issuance dual-run, then redemption dual-run.</li>
        <li>Reconciliation clean over a sustained window.</li>
        <li>Limited customer pilot, then merchant pilot.</li>
        <li>Legacy retirement — <strong>only</strong> after the key-management gate passes.</li>
      </ol>

      <h2>Rollback</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Every step is independently reversible: stop dual-writing and revert to your ledger.
        PayChain never deletes financial records, so a rollback leaves a complete audit trail.
        Your legacy wallet is not retired until migration is approved — rollback is always
        available until then.
      </p>

      <h2>What is simulated today</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        So you do not build on a promise: reserve funding, fiat payout and sanctions screening are
        mock providers. Loyalty points issue, transfer and redeem for real on testnet. Stablecoin
        features stay disabled until PayChain&apos;s readiness gates pass.
      </p>
    </div>
  );
}
