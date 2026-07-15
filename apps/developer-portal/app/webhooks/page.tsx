const EVENTS = [
  'asset.issued',
  'asset.transferred',
  'asset.redeemed',
  'asset.burned',
  'transaction.compensated',
];

const VERIFY_SNIPPET = `import { PayChainClient } from '@paychain/sdk';

// signature = HMAC-SHA256(secret, \`\${timestamp}.\${rawBody}\`)
const ok = PayChainClient.verifyWebhook(
  secret,
  rawBody,
  req.headers['x-paychain-signature'],
  req.headers['x-paychain-timestamp'],
);
if (!ok) return res.status(400).end();  // bad signature or stale timestamp`;

export default function Webhooks() {
  return (
    <div className="wrap">
      <h1>Webhooks</h1>
      <p className="lead">
        Register an endpoint (<span className="mono">POST /api/v1/webhooks</span>) with the events
        you care about; the signing secret is returned once. Delivery is at-least-once — make
        handlers idempotent (dedupe on the delivery id / transaction id).
      </p>

      <h2>Security</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Every delivery is signed with HMAC-SHA256 over <span className="mono">timestamp.body</span>
        and includes <span className="mono">X-PayChain-Signature</span> +{' '}
        <span className="mono">X-PayChain-Timestamp</span> (replay protection). Verify before trusting:
      </p>
      <pre>
        <code>{VERIFY_SNIPPET}</code>
      </pre>

      <h2>Events</h2>
      <div className="table-wrap">
        <table>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={e}>
                <td className="mono">{e}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="lead" style={{ fontSize: 13 }}>
        Retries use exponential backoff; exhausted deliveries move to a dead-letter state and can
        be replayed.
      </p>
    </div>
  );
}
