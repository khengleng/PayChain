const API_BASE = process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com';

const TRUSTEE_TOKEN = `curl -s -X POST ${API_BASE}/api/v1/oauth/token \\
  -H 'content-type: application/json' \\
  -d '{"client_id":"...","client_secret":"...","grant_type":"client_credentials"}'`;

const CHECKS = `# Read platform readiness
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/platform/readiness

# Inspect reserve state for one stablecoin
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/stablecoins/<stablecoin-id>/reserve

# Inspect reserve verification and current attestation
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/stablecoins/<stablecoin-id>/reserve/verification
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/stablecoins/<stablecoin-id>/attestations/current

# Review reserve and treasury movement history
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/reserve/movements
curl -H "Authorization: Bearer $TOKEN" \\
  ${API_BASE}/api/v1/treasury/movements/history`;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="mono" style={{ whiteSpace: 'nowrap', paddingRight: 16 }}>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

export default function TrusteeIntegration() {
  return (
    <div className="wrap">
      <h1>Trustee integration</h1>
      <p className="lead">
        Read-only verification surface for a trustee, auditor, or external reviewer. This
        integration inspects PayChain evidence; it does not operate the platform.
      </p>

      <h2>1. Request a trustee credential</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        Ask the PayChain operator to issue a tenant API client using the trustee preset. The
        credential is intentionally limited to readiness, reserve, treasury, and stablecoin reads.
      </p>
      <pre>
        <code>{TRUSTEE_TOKEN}</code>
      </pre>

      <h2>2. What to verify</h2>
      <table style={{ fontSize: 14, marginBottom: 16 }}>
        <tbody>
          <Row label="Readiness" value="Inspect mandatory gates and the exact blockers before any production claim." />
          <Row label="Reserve state" value="Compare outstanding supply, reserve balance, ratio, and shortfall status." />
          <Row label="Reserve verification" value="Compare ledger-derived reserve figures with corroborated bank-side verification." />
          <Row label="Attestations" value="Inspect the currently active external reserve attestation and version history." />
          <Row label="Treasury history" value="Review treasury movement approvals and settlement references without mutation rights." />
        </tbody>
      </table>

      <h2>3. Sample checks</h2>
      <pre>
        <code>{CHECKS}</code>
      </pre>

      <h2>4. Current boundary</h2>
      <p className="lead" style={{ fontSize: 14 }}>
        This surface makes trustee review possible, but it does not by itself clear legal,
        compliance, key-management, or mainnet readiness gates. Treat it as verification access
        while the remaining mandatory controls are completed.
      </p>
    </div>
  );
}
