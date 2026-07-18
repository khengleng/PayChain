const DEFAULT_BASE_URL = 'https://api.paychain.cambobia.com';

async function getJson(url, init = {}) {
  const res = await fetch(url, init);
  const payload = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, payload };
}

function assertOverviewShape(payload) {
  const counts = payload?.counts;
  const readiness = payload?.readiness;
  const requiredCountKeys = [
    'tenants',
    'wallets',
    'assets',
    'stablecoins',
    'reserveAccounts',
    'treasuryPending',
    'complianceOpen',
    'reconciliationOpen',
    'flagOverrides',
    'recentAuditEvents',
  ];

  if (!counts || typeof counts !== 'object') {
    throw new Error('overview payload is missing counts');
  }
  for (const key of requiredCountKeys) {
    if (typeof counts[key] !== 'number') {
      throw new Error(`overview counts.${key} is missing or not numeric`);
    }
  }
  if (!readiness || typeof readiness !== 'object') {
    throw new Error('overview payload is missing readiness');
  }
  if (typeof readiness.productionReady !== 'boolean') {
    throw new Error('overview readiness.productionReady is missing or not boolean');
  }
  if (typeof readiness.mandatoryTotal !== 'number' || typeof readiness.mandatoryPassed !== 'number') {
    throw new Error('overview readiness totals are missing or not numeric');
  }
  if (!Array.isArray(readiness.blockedBy)) {
    throw new Error('overview readiness.blockedBy is missing or not an array');
  }
}

async function main() {
  const baseUrl = (process.env.PAYCHAIN_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const adminToken = process.env.PAYCHAIN_ADMIN_TOKEN;

  const ready = await getJson(`${baseUrl}/api/v1/health/ready`);
  if (!ready.ok) {
    throw new Error(`readiness health check failed with HTTP ${ready.status}`);
  }

  if (!adminToken) {
    throw new Error('PAYCHAIN_ADMIN_TOKEN is required to verify /api/v1/admin/overview');
  }

  const overview = await getJson(`${baseUrl}/api/v1/admin/overview`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  if (!overview.ok) {
    throw new Error(`/api/v1/admin/overview failed with HTTP ${overview.status}`);
  }

  assertOverviewShape(overview.payload);

  console.log(`Verified ${baseUrl}/api/v1/admin/overview`);
  console.log(JSON.stringify({
    productionReady: overview.payload.readiness.productionReady,
    mandatoryPassed: overview.payload.readiness.mandatoryPassed,
    mandatoryTotal: overview.payload.readiness.mandatoryTotal,
    counts: overview.payload.counts,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
