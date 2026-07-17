/**
 * Sandbox stablecoin demo data (§0.2, §15, §23, §27).
 *
 * Makes the stablecoin path actually walkable: a test coin through its six-gate lifecycle, its
 * own reserve, wallet policies, and a mint that succeeds — plus mints that are REFUSED, which is
 * the more valuable half.
 *
 * Deliberate choices, because each is the kind of thing a reviewer will probe:
 *
 * - USD-referenced, not KHR. A KHR coin is pinned in LEGAL_REVIEW until legal sign-off is
 *   recorded (§0.6) — that pin is correct and must not be worked around for a demo. Using USD
 *   demonstrates the lifecycle without asserting a legal position PayChain does not hold.
 * - Reserve is registered against the STABLECOIN, not the loyalty asset. An earlier seeding run
 *   attached reserve to PTS, which backs nothing: loyalty points need no reserve, a stablecoin
 *   does.
 * - Gate approvals carry evidence text saying plainly that they are sandbox demonstrations and
 *   NOT legal/compliance assertions. Gate changes are permanent and attributed in the audit
 *   chain; a demo must not leave behind a record that reads like a real approval.
 * - Everything is driven through the real API, so maker-checker, §27 and the reserve guards all
 *   genuinely apply.
 *
 * Idempotent. Usage: DATABASE_URL=... npx tsx scripts/seed-stablecoin-demo.ts
 */
import { randomBytes } from 'node:crypto';
import { createPrismaClient } from '../src/index';
import { hashPassword, currentTotp } from '@paychain/security';

const API = (process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com') + '/api/v1';
const TAG = 'DEMO';
const EVIDENCE =
  'DEMO/SANDBOX ONLY — recorded to demonstrate the six-gate lifecycle on testnet. This is NOT a ' +
  'legal, compliance, treasury or reserve assertion, and confers no readiness for real value.';

type Json = Record<string, any>;
const ok = (s: number) => s >= 200 && s < 300;
const idem = () => `scdemo-${randomBytes(8).toString('hex')}`;

async function req(method: string, path: string, o: { body?: unknown; token?: string; idem?: string } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(o.token ? { Authorization: `Bearer ${o.token}` } : {}),
      ...(o.idem ? { 'Idempotency-Key': o.idem } : {}),
    },
    body: o.body ? JSON.stringify(o.body) : undefined,
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Json };
}

async function adminSession(prisma: any, email: string, role: string): Promise<string> {
  const password = `Sd-${randomBytes(12).toString('base64url')}`;
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), role, status: 'ACTIVE', mfaEnabled: false, mfaSecretEnc: null },
    create: { email, passwordHash: hashPassword(password), role, fullName: `${TAG} seeder`, createdBy: 'seed-sc' },
  });
  const l = await req('POST', '/admin/auth/login', { body: { email, password } });
  const s = await req('POST', '/admin/auth/mfa/setup', { body: { challengeToken: l.json.challengeToken } });
  const v = await req('POST', '/admin/auth/mfa/verify', {
    body: { challengeToken: l.json.challengeToken, code: currentTotp(s.json.secret) },
  });
  if (!v.json.access_token) throw new Error(`session failed for ${email}: ${JSON.stringify(v.json)}`);
  return v.json.access_token;
}

async function tenantToken(admin: string, tenantId: string, name: string, scopes: string[], prisma: any) {
  const existing = await prisma.apiClient.findFirst({ where: { name } });
  if (existing) {
    // Secrets are not retrievable by design, so rotate to get a usable one.
    const rot = await req('POST', `/admin/clients/${existing.id}/rotate-secret`, { token: admin });
    const t = await req('POST', '/oauth/token', {
      body: { grant_type: 'client_credentials', client_id: rot.json.clientId, client_secret: rot.json.clientSecret },
    });
    return t.json.access_token as string;
  }
  const c = await req('POST', `/admin/tenants/${tenantId}/clients`, {
    body: { name, clientIdPrefix: 'demo-sc', scopes, ownerEmail: 'demo-maker@paychain.cambobia.com' },
    token: admin,
  });
  if (!ok(c.status)) throw new Error(`client failed: ${JSON.stringify(c.json)}`);
  const t = await req('POST', '/oauth/token', {
    body: { grant_type: 'client_credentials', client_id: c.json.clientId, client_secret: c.json.clientSecret },
  });
  return t.json.access_token as string;
}

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  const log = (m: string) => console.log(m);

  const maker = await adminSession(prisma, 'demo-maker@paychain.cambobia.com', 'SUPER_ADMIN');
  const checker = await adminSession(prisma, 'demo-checker@paychain.cambobia.com', 'SUPER_ADMIN');
  const tenant = await prisma.tenant.findFirst({ where: { name: 'PayKH Sandbox' } });
  if (!tenant) throw new Error('PayKH Sandbox tenant not found');

  const scMaker = await tenantToken(maker, tenant.id, `${TAG} Stablecoin Ops`,
    ['stablecoin.manage', 'stablecoin.read', 'reserve.manage', 'wallet.read'], prisma);
  const scChecker = await tenantToken(maker, tenant.id, `${TAG} Stablecoin Approver`,
    ['stablecoin.approve', 'stablecoin.read'], prisma);

  // --- 1. A USD test stablecoin (KHR stays legally pinned — see header) ---------------------
  let asset = await prisma.asset.findFirst({ where: { tenantId: tenant.id, assetCode: 'DUSD' } });
  if (!asset) {
    const created = await req('POST', '/stablecoins', {
      body: {
        assetCode: 'DUSD', assetName: `${TAG} USD test stablecoin`,
        classification: 'FIAT_BACKED_STABLECOIN', referenceCurrency: 'USD',
        issuerLegalEntity: `${TAG} Issuer Ltd`, jurisdiction: 'KH', reserveRatioTarget: '1.05',
      },
      token: scMaker, idem: idem(),
    });
    if (!ok(created.status)) throw new Error(`create failed: ${JSON.stringify(created.json)}`);
    asset = await prisma.asset.findFirst({ where: { tenantId: tenant.id, assetCode: 'DUSD' } });
    log(`1. stablecoin DUSD created (target ratio 1.05)`);
  } else {
    log(`1. stablecoin DUSD exists`);
  }
  const config = await prisma.stablecoinConfig.findFirst({ where: { assetId: asset!.id } });

  // --- 2. Reserve for THIS asset, maker-checked -------------------------------------------
  let account = await prisma.reserveAccount.findFirst({ where: { assetId: asset!.id } });
  if (!account) {
    const reg = await req('POST', `/admin/tenants/${tenant.id}/reserve-accounts`, {
      body: {
        assetId: asset!.id, label: `${TAG} · DUSD reserve (mock custodian)`,
        bankReference: `FUND-${TAG}-DUSD`, custodianReference: `${TAG}-CUSTODIAN`,
      },
      token: maker,
    });
    if (!ok(reg.status)) throw new Error(`reserve account failed: ${JSON.stringify(reg.json)}`);
    account = await prisma.reserveAccount.findFirst({ where: { assetId: asset!.id } });
    const mv = await req('POST', `/admin/tenants/${tenant.id}/reserve/movements`, {
      body: { reserveAccountId: account!.id, direction: 'CREDIT', amount: '100000.00', reference: `FUND-${TAG}-DUSD` },
      token: maker,
    });
    const applied = await req('POST', `/admin/reserve/movements/${mv.json.id}/approve`, { token: checker });
    log(`2. reserve for DUSD: ${applied.json.balanceAfter ?? '?'} (requested + approved by different people)`);
  } else {
    log(`2. reserve for DUSD exists: ${account.balance}`);
  }

  // --- 3. The six-gate lifecycle ------------------------------------------------------------
  if (config && config.lifecycleState !== 'ACTIVE') {
    await req('POST', `/stablecoins/${config.id}/submit-for-review`, { token: scMaker });
    for (const gate of ['LEGAL', 'COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT']) {
      // Approved by a DIFFERENT principal than the creator — the service enforces this.
      const g = await req('POST', `/stablecoins/${config.id}/approve-gate`, {
        body: { gate, note: EVIDENCE }, token: scChecker,
      });
      if (!ok(g.status)) log(`   gate ${gate} -> ${g.status} ${JSON.stringify(g.json).slice(0, 70)}`);
    }
    // advance() takes an EXPLICIT target state — it is not a "next" button. The transition table
    // rejects any jump, so each state is named in order. ACTIVE is deliberately NOT reachable
    // here: the controller refuses it and requires /activate under stablecoin.approve, so a
    // manage-only caller cannot flip a coin live.
    const path = [
      'COMPLIANCE_REVIEW', 'TREASURY_REVIEW', 'RESERVE_PENDING', 'TECHNICAL_TESTING', 'PILOT_APPROVED',
    ];
    for (const toState of path) {
      const a = await req('POST', `/stablecoins/${config.id}/advance`, { body: { toState }, token: scMaker });
      if (!ok(a.status)) { log(`   advance -> ${toState}: ${a.status} ${String(a.json.message).slice(0, 70)}`); break; }
    }
    const act = await req('POST', `/stablecoins/${config.id}/activate`, { token: scChecker });
    if (!ok(act.status)) log(`   activate: ${act.status} ${String(act.json.message).slice(0, 80)}`);
    const now = await prisma.stablecoinConfig.findUnique({ where: { id: config.id } });
    log(`3. lifecycle: ${now?.lifecycleState} (six gates approved by a second principal, evidence marks them DEMO)`);
  } else {
    log(`3. lifecycle: ${config?.lifecycleState}`);
  }

  // --- 4. Wallet policies (§27 default-deny needs an explicit grant) ------------------------
  const wallets = await prisma.wallet.findMany({ where: { tenantId: tenant.id }, take: 3 });
  for (const [i, w] of wallets.entries()) {
    const existing = await prisma.walletStablecoinPolicy.findFirst({ where: { walletId: w.id, assetId: asset!.id } });
    if (existing) { log(`   policy for ${w.ownerReference} exists`); continue; }
    // The last wallet is deliberately left WITHOUT a policy, so the refusal can be demonstrated.
    if (i === wallets.length - 1) {
      log(`   ${w.ownerReference}: NO policy — kept unpolicied to demonstrate §27 default-deny`);
      continue;
    }
    const p = await req('POST', `/admin/wallets/${w.id}/stablecoin-policy`, {
      body: {
        assetId: asset!.id, kycLevel: 'STANDARD', riskRating: 'LOW', sanctionsStatus: 'CLEAR',
        maxBalance: '50000', maxDailyReceive: '10000', maxDailySend: '5000',
        redemptionEligible: true, transferRestricted: false, frozen: false, eddRequired: false,
      },
      token: maker,
    });
    log(`   policy granted to ${w.ownerReference} -> ${p.status} (KYC STANDARD, cap 50000, daily 10000)`);
  }

  // §23: minting now refuses on unverified reserve data, and a snapshot is what verifies it.
  // Taking one here is not a workaround — it is the operator action the control demands.
  const snap = await req('POST', `/stablecoins/${asset!.id}/reserve-snapshots`, { token: scMaker });
  log(`4. reserve snapshot taken -> ${snap.status} (§23: minting refuses on unverified reserve)`);

  // --- 5. The controls, demonstrated both ways ----------------------------------------------
  const enabled = wallets[0];
  const unpolicied = wallets[wallets.length - 1];
  if (config && enabled) {
    log('\n5. controls:');

    const over = await req('POST', `/stablecoins/${asset!.id}/mint-requests`, {
      body: { destinationWalletId: enabled.id, amount: '999999', fundingReference: `FUND-${TAG}-DUSD` },
      token: scMaker, idem: idem(),
    });
    if (ok(over.status)) {
      for (let i = 0; i < 5; i += 1) {
        const a = await req('POST', `/mint-requests/${over.json.id}/advance`, { token: scMaker });
        if (a.json.status === 'APPROVAL_REQUIRED') {
          await req('POST', `/mint-requests/${over.json.id}/approve`, { token: scChecker });
          continue;
        }
        if (!ok(a.status)) { log(`   mint 999999 (reserve 100000) -> REFUSED: ${String(a.json.message).slice(0, 80)}`); break; }
      }
    }

    if (unpolicied && unpolicied.id !== enabled.id) {
      const noPol = await req('POST', `/stablecoins/${asset!.id}/mint-requests`, {
        body: { destinationWalletId: unpolicied.id, amount: '10', fundingReference: `FUND-${TAG}-DUSD` },
        token: scMaker, idem: idem(),
      });
      if (ok(noPol.status)) {
        for (let i = 0; i < 5; i += 1) {
          const a = await req('POST', `/mint-requests/${noPol.json.id}/advance`, { token: scMaker });
          if (a.json.status === 'APPROVAL_REQUIRED') {
            await req('POST', `/mint-requests/${noPol.json.id}/approve`, { token: scChecker });
            continue;
          }
          if (!ok(a.status)) { log(`   mint into unpolicied wallet -> REFUSED: ${String(a.json.message).slice(0, 80)}`); break; }
        }
      }
    }

    const good = await req('POST', `/stablecoins/${asset!.id}/mint-requests`, {
      body: { destinationWalletId: enabled.id, amount: '1000', fundingReference: `FUND-${TAG}-DUSD` },
      token: scMaker, idem: idem(),
    });
    if (ok(good.status)) {
      for (let i = 0; i < 6; i += 1) {
        const a = await req('POST', `/mint-requests/${good.json.id}/advance`, { token: scMaker });
        if (a.json.status === 'APPROVAL_REQUIRED') {
          const self = await req('POST', `/mint-requests/${good.json.id}/approve`, { token: scMaker });
          log(`   self-approval by requester -> ${self.status} (expect 403)`);
          await req('POST', `/mint-requests/${good.json.id}/approve`, { token: scChecker });
          continue;
        }
        if (!ok(a.status)) { log(`   mint 1000 -> ${a.status} ${String(a.json.message).slice(0, 70)}`); break; }
        if (['CONFIRMED', 'RECONCILED'].includes(a.json.status)) { log(`   mint 1000 -> ${a.json.status} ✓`); break; }
      }
    }
  }

  await prisma.adminUser.updateMany({
    where: { email: { in: ['demo-maker@paychain.cambobia.com', 'demo-checker@paychain.cambobia.com'] } },
    data: { status: 'DISABLED' },
  });
  log('\nseeder identities disabled.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
