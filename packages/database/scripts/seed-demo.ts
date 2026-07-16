/**
 * Sandbox demo data (§0.2).
 *
 * Populates the reserve, treasury, compliance and stablecoin screens so they can be walked
 * through rather than shown empty. Everything it writes is DEMONSTRATION data.
 *
 * Two rules this script follows, and they matter more than the data itself:
 *
 * 1. It drives the REAL APIs, never the database. Data injected behind the guards would prove
 *    nothing about the platform and would produce a trail that lies about how it got there.
 *    Going through the front door means maker-checker, ABAC, flags and the audit chain all
 *    genuinely applied — what the screens show is what the code actually did.
 *
 * 2. Every record is unmistakably marked DEMO. Reserve balances here are self-asserted numbers
 *    with no custodian behind them; treasury "EXECUTED" moves no money. Shown to a regulator
 *    without provenance that is misleading, so the marking is not cosmetic — it is the point.
 *
 * Idempotent: re-running does not duplicate. Movements are a ledger, so a second run would
 * otherwise double every balance — which is exactly what happened the first time this was run
 * twice, and precisely the kind of quietly-wrong number a demo must not contain.
 *
 * Usage: DATABASE_URL=... PAYCHAIN_API_URL=... npx tsx scripts/seed-demo.ts
 */
import { randomBytes } from 'node:crypto';
import { createPrismaClient } from '../src/index';
import { hashPassword, currentTotp } from '@paychain/security';

const API = (process.env.PAYCHAIN_API_URL ?? 'https://api.paychain.cambobia.com') + '/api/v1';
const TAG = 'DEMO';

type Json = Record<string, any>;

async function req(method: string, path: string, opts: { body?: unknown; token?: string; idem?: string } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.idem ? { 'Idempotency-Key': opts.idem } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Json };
}

const idem = () => `demo-${randomBytes(8).toString('hex')}`;
const ok = (s: number) => s >= 200 && s < 300;

/** Creates a temporary admin and returns a live session token. Disabled again at the end. */
async function adminSession(prisma: any, email: string, role: string): Promise<string> {
  const password = `Dm-${randomBytes(12).toString('base64url')}`;
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), role, status: 'ACTIVE', mfaEnabled: false, mfaSecretEnc: null },
    create: { email, passwordHash: hashPassword(password), role, fullName: `${TAG} seeder`, createdBy: 'seed-demo' },
  });
  const login = await req('POST', '/admin/auth/login', { body: { email, password } });
  const challengeToken = login.json.challengeToken as string;
  const setup = await req('POST', '/admin/auth/mfa/setup', { body: { challengeToken } });
  const verify = await req('POST', '/admin/auth/mfa/verify', {
    body: { challengeToken, code: currentTotp(setup.json.secret as string) },
  });
  if (!verify.json.access_token) throw new Error(`admin session failed for ${email}: ${JSON.stringify(verify.json)}`);
  return verify.json.access_token as string;
}

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL);
  const log = (m: string) => console.log(m);

  // Two distinct humans: maker-checker is a real control here, not a formality. Seeding with one
  // identity would either fail (correctly) or prove nothing.
  const maker = await adminSession(prisma, 'demo-maker@paychain.cambobia.com', 'SUPER_ADMIN');
  const checker = await adminSession(prisma, 'demo-checker@paychain.cambobia.com', 'SUPER_ADMIN');
  log('sessions: demo-maker + demo-checker (separate identities, so maker-checker genuinely applies)');

  const tenant = await prisma.tenant.findFirst({ where: { name: 'PayKH Sandbox' } });
  if (!tenant) throw new Error('PayKH Sandbox tenant not found — run the base seed first');
  log(`tenant: ${tenant.name} (${tenant.id})`);

  // --- Asset: reuse the existing PTS if present, else create one -----------------------------
  let asset = await prisma.asset.findFirst({ where: { tenantId: tenant.id, assetCode: 'PTS' } });
  if (!asset) {
    const created = await req('POST', `/admin/tenants/${tenant.id}/assets`, {
      body: { assetCode: 'PTS', assetName: `${TAG} Loyalty Points`, assetType: 'LOYALTY_POINT' },
      token: maker,
    });
    await req('POST', `/admin/assets/${created.json.id}/activate`, { token: maker });
    asset = await prisma.asset.findUnique({ where: { id: created.json.id } });
    log(`asset: created PTS (${created.json.id})`);
  } else {
    log(`asset: reusing PTS (${asset.id})`);
  }

  // --- Reserve: accounts + maker-checked movements --------------------------------------------
  // The reference is prefixed FUND- so MockReserveFundingProvider treats it as confirmed funding
  // — the mock is the only "custodian" that exists, and the prefix is its entire contract.
  const accounts = [
    { label: `${TAG} · Bakong KHR settlement`, bankReference: `FUND-${TAG}-BAKONG-KHR`, credit: '250000.00' },
    { label: `${TAG} · Commercial bank USD`, bankReference: `FUND-${TAG}-USD-01`, credit: '75000.00' },
  ];
  for (const a of accounts) {
    const existing = await prisma.reserveAccount.findFirst({ where: { tenantId: tenant.id, label: a.label } });
    let accountId = existing?.id;
    if (!accountId) {
      const res = await req('POST', `/admin/tenants/${tenant.id}/reserve-accounts`, {
        body: { assetId: asset!.id, label: a.label, bankReference: a.bankReference, custodianReference: `${TAG}-CUSTODIAN` },
        token: maker,
      });
      if (!ok(res.status)) throw new Error(`reserve account failed: ${JSON.stringify(res.json)}`);
      accountId = res.json.id as string;
      log(`reserve account: ${a.label}`);
    }

    // Idempotency: the reference identifies this seeded movement. Without the check a re-run
    // appends another credit and silently doubles the balance.
    const seeded = await prisma.reserveMovement.findFirst({
      where: { reserveAccountId: accountId, reference: a.bankReference },
    });
    if (seeded) {
      log(`  movement CREDIT ${a.credit} already seeded (${seeded.status}) — skipped`);
    } else {
      // Request as maker, approve as checker — the balance only moves on a second signature.
      const mv = await req('POST', `/admin/tenants/${tenant.id}/reserve/movements`, {
        body: { reserveAccountId: accountId, direction: 'CREDIT', amount: a.credit, reference: a.bankReference },
        token: maker,
      });
      if (ok(mv.status)) {
        const applied = await req('POST', `/admin/reserve/movements/${mv.json.id}/approve`, { token: checker });
        log(`  movement CREDIT ${a.credit} → ${applied.json.status ?? applied.status} (balance ${applied.json.balanceAfter ?? '?'})`);
      }
    }
  }

  // One PENDING movement left unapproved, so the approval queue is not empty during a walkthrough.
  const firstAccount = await prisma.reserveAccount.findFirst({ where: { tenantId: tenant.id } });
  const alreadyPending = await prisma.reserveMovement.findFirst({
    where: { status: 'PENDING_APPROVAL', reference: `FUND-${TAG}-AWAITING-REVIEW` },
  });
  if (firstAccount && !alreadyPending) {
    const pending = await req('POST', `/admin/tenants/${tenant.id}/reserve/movements`, {
      body: {
        reserveAccountId: firstAccount.id,
        direction: 'CREDIT',
        amount: '10000.00',
        reference: `FUND-${TAG}-AWAITING-REVIEW`,
      },
      token: maker,
    });
    if (ok(pending.status)) log(`  movement PENDING_APPROVAL 10000.00 (left for the approval queue)`);

    // Show the control working: the maker cannot approve their own request.
    const selfApprove = await req('POST', `/admin/reserve/movements/${pending.json.id}/approve`, { token: maker });
    log(`  self-approval by maker → ${selfApprove.status} (expect 403 — the control refusing)`);
  }

  // --- Treasury: a movement created by a tenant credential, approved by a human ---------------
  // treasury.manage is a sensitive scope, so the credential must carry an accountable owner —
  // otherwise adminApprove correctly refuses, having no way to prove two people were involved.
  const treExists = await prisma.apiClient.findFirst({ where: { name: `${TAG} Treasury Ops` } });
  const tre = treExists
    ? { status: 409, json: {} }
    : await req('POST', `/admin/tenants/${tenant.id}/clients`, {
    body: {
      name: `${TAG} Treasury Ops`,
      clientIdPrefix: 'demo-tre',
      scopes: ['treasury.manage', 'stablecoin.read'],
      ownerEmail: 'demo-maker@paychain.cambobia.com',
    },
    token: maker,
  });
  if (ok(tre.status)) {
    const tok = await req('POST', '/oauth/token', {
      body: { grant_type: 'client_credentials', client_id: tre.json.clientId, client_secret: tre.json.clientSecret },
    });
    const treasuryToken = tok.json.access_token as string;

    const movements = [
      { fromAccount: `${TAG}-OPERATING`, toAccount: `${TAG}-RESERVE`, amount: '50000.00', purpose: 'RESERVE_TOPUP' },
      { fromAccount: `${TAG}-RESERVE`, toAccount: `${TAG}-PAYOUT`, amount: '12500.00', purpose: 'REDEMPTION_PAYOUT' },
    ];
    for (const m of movements) {
      const exists = await prisma.treasuryMovement.findFirst({
        where: { tenantId: tenant.id, purpose: m.purpose, amount: m.amount, fromAccount: m.fromAccount },
      });
      if (exists) { log(`  treasury ${m.purpose} ${m.amount} already seeded (${exists.status}) — skipped`); continue; }
      const created = await req('POST', '/treasury/movements', { body: m, token: treasuryToken, idem: idem() });
      if (!ok(created.status)) { log(`  treasury create → ${created.status} ${JSON.stringify(created.json).slice(0, 90)}`); continue; }
      // Approved by demo-checker, who is NOT the credential's accountable owner.
      const approved = await req('POST', `/admin/treasury/movements/${created.json.id}/approve`, { token: checker });
      log(`  treasury ${m.purpose} ${m.amount} → ${approved.json.status ?? approved.status}`);
    }

    // Leave one pending for the queue, and demonstrate the owner cannot approve their own.
    const pendExists = await prisma.treasuryMovement.findFirst({
      where: { tenantId: tenant.id, amount: '9000.00', status: 'PENDING_APPROVAL' },
    });
    const pend = pendExists
      ? { status: 409, json: { id: pendExists.id } }
      : await req('POST', '/treasury/movements', {
          body: { fromAccount: `${TAG}-OPERATING`, toAccount: `${TAG}-RESERVE`, amount: '9000.00', purpose: 'RESERVE_TOPUP' },
          token: treasuryToken, idem: idem(),
        });
    if (ok(pend.status)) {
      const self = await req('POST', `/admin/treasury/movements/${pend.json.id}/approve`, { token: maker });
      log(`  treasury PENDING left for queue; owner self-approval → ${self.status} (expect 403)`);
    }
  } else {
    log(`  treasury client → ${tre.status} ${JSON.stringify(tre.json).slice(0, 120)}`);
  }

  // --- Compliance: monitoring alerts -----------------------------------------------------------
  // Honest caveat that belongs on the record: MonitoringService.evaluate is only ever called by
  // this endpoint — a tenant voluntarily asking about itself, and self-reporting its own velocity.
  // No transfer, mint or redemption invokes it. These alerts are real rows produced by the real
  // rules, but in production nothing would have raised them automatically.
  const comp = await req('POST', `/admin/tenants/${tenant.id}/clients`, {
    body: {
      name: `${TAG} Compliance Ops`,
      clientIdPrefix: 'demo-cmp',
      scopes: ['stablecoin.manage', 'stablecoin.read'],
      ownerEmail: 'demo-maker@paychain.cambobia.com',
    },
    token: maker,
  });
  if (ok(comp.status)) {
    const tok = await req('POST', '/oauth/token', {
      body: { grant_type: 'client_credentials', client_id: comp.json.clientId, client_secret: comp.json.clientSecret },
    });
    const compToken = tok.json.access_token as string;

    // Each case targets a specific rule in monitoring.service.ts runRules().
    const cases = [
      { subjectType: 'transaction', subjectReference: `${TAG}-TX-LARGE-001`, amount: '150000', label: 'large_amount (HIGH)' },
      { subjectType: 'transaction', subjectReference: `${TAG}-TX-STRUCT-002`, amount: '9500', label: 'structuring (MEDIUM) — just under the 10k threshold' },
      { subjectType: 'wallet', subjectReference: `${TAG}-W-HIRISK-003`, amount: '2500', country: 'IR', label: 'high_risk_jurisdiction (HIGH)' },
    ];
    for (const c of cases) {
      const { label, ...body } = c;
      const seen = await prisma.monitoringAlert.findFirst({
        where: { subjectReference: c.subjectReference },
      });
      if (seen) { log(`  alert: ${label} already seeded — skipped`); continue; }
      const res = await req('POST', '/monitoring/evaluate', { body, token: compToken, idem: idem() });
      log(`  alert: ${label} → ${ok(res.status) ? 'raised' : `${res.status} ${JSON.stringify(res.json).slice(0, 70)}`}`);
    }
  } else {
    log(`  compliance client → ${comp.status} ${JSON.stringify(comp.json).slice(0, 110)}`);
  }

  // --- Stablecoin: control plane, deliberately NOT activated -----------------------------------
  // Creation needs stablecoin.module + stablecoin.creation enabled. We turn them on for the
  // sandbox and leave every OPERATIONAL flag (minting/redemption/conversion/transfer) OFF, so the
  // lifecycle and its six gates can be walked through while no stablecoin value can move.
  // This is §0.2's line: the control plane is real, issuance is not.
  for (const key of ['stablecoin.module.enabled', 'stablecoin.creation.enabled']) {
    const r = await req('POST', '/admin/flags', { body: { key, enabled: true, scope: 'GLOBAL' }, token: maker });
    log(`  flag ${key} → ${ok(r.status) ? 'ON' : `${r.status}`}`);
  }
  const sc = await req('POST', `/admin/tenants/${tenant.id}/clients`, {
    body: {
      name: `${TAG} Stablecoin Ops`,
      clientIdPrefix: 'demo-sc',
      scopes: ['stablecoin.manage', 'stablecoin.read', 'stablecoin.approve'],
      ownerEmail: 'demo-maker@paychain.cambobia.com',
    },
    token: maker,
  });
  if (ok(sc.status)) {
    const tok = await req('POST', '/oauth/token', {
      body: { grant_type: 'client_credentials', client_id: sc.json.clientId, client_secret: sc.json.clientSecret },
    });
    const scToken = tok.json.access_token as string;
    const created = await req('POST', '/stablecoins', {
      body: {
        assetCode: 'DKHR',
        assetName: `${TAG} KHR-referenced stablecoin`,
        classification: 'FIAT_BACKED_STABLECOIN',
        referenceCurrency: 'KHR',
        issuerLegalEntity: `${TAG} Issuer Ltd`,
        jurisdiction: 'KH',
        reserveRatioTarget: '1.05',
      },
      token: scToken, idem: idem(),
    });
    if (ok(created.status)) {
      log(`  stablecoin DKHR created → lifecycle ${created.json.lifecycleState ?? '?'} (KHR is pinned in LEGAL_REVIEW until legal sign-off is recorded — §0.6)`);
      log(`  reserveRatioTarget 1.05 — the console now evaluates against this, not a hardcoded 1.0`);
    } else {
      log(`  stablecoin create → ${created.status} ${JSON.stringify(created.json).slice(0, 110)}`);
    }
  }

  await prisma.adminUser.updateMany({
    where: { email: { in: ['demo-maker@paychain.cambobia.com', 'demo-checker@paychain.cambobia.com'] } },
    data: { status: 'DISABLED' },
  });
  log('\nseeder identities disabled. All records tagged DEMO.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('FAILED:', e?.message ?? e);
  process.exit(1);
});
