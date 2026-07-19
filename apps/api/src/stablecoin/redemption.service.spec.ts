import { RedemptionService } from './redemption.service';

const ASSET = {
  id: 'a1',
  tenantId: 't1',
  assetCode: 'USDX',
  issuerPublicKey: 'GISSUER',
  stablecoinConfig: { lifecycleState: 'ACTIVE', minimumRedemptionAmount: null, maximumRedemptionAmount: null },
};

function statefulPrisma(initial: Record<string, unknown>) {
  let rec: Record<string, unknown> = { ...initial };
  return {
    store: () => rec,
    stablecoinRedemption: {
      findUnique: async () => ({ ...rec }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        rec = { ...rec, ...data };
        return { ...rec };
      },
      updateMany: async ({ where, data }: { where: { status: string }; data: { status: string } }) => {
        if (rec.status === where.status) {
          rec = { ...rec, ...data };
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    asset: { findUnique: async () => ({ ...ASSET }) },
    // tenantId and status are required by the service: a redeemer wallet is now tenant-scoped
    // and status-checked, so a fixture without them is not a realistic wallet.
    wallet: {
      findUnique: async () => ({
        id: 'w1',
        tenantId: 't1',
        status: 'ACTIVE',
        stellarAccountId: 'GHOLDER',
        stellarSecretEnc: 'enc',
      }),
    },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function build(prisma: unknown, payout: unknown, chain: unknown) {
  return new RedemptionService(
    prisma as never,
    { decrypt: () => 'S' } as never,
    { record: jest.fn() } as never,
    { requireEnabled: jest.fn() } as never,
    { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) } as never,
    payout as never,
    chain as never,
    // Permissive: these tests are about §0.8 sequencing, not §27. Policy has its own tests.
    { assertAllowed: jest.fn().mockResolvedValue(undefined) } as never,
    { refreshFromChain: jest.fn().mockResolvedValue(undefined) } as never,
  );
}

describe('RedemptionService saga (§25, §0.8)', () => {
  it('burns only after payout confirms, completes only when both legs confirm, and never double-burns', async () => {
    const prisma = statefulPrisma({
      id: 'r1',
      tenantId: 't1',
      assetId: 'a1',
      walletId: 'w1',
      amount: '100',
      status: 'APPROVED',
      bankAccountReference: 'BANK-1',
    });
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'B', submitted: true });
    const getTransaction = jest
      .fn()
      .mockRejectedValueOnce(new Error('timeout')) // burn confirmation times out first
      .mockResolvedValueOnce({ status: 'confirmed' });
    const payout = {
      initiatePayout: jest.fn().mockResolvedValue({ payoutReference: 'PAYOUT-1', status: 'PENDING' }),
      getPayoutStatus: jest.fn().mockResolvedValue('CONFIRMED'),
    };
    const svc = build(prisma, payout, { burnAsset, getTransaction });

    await svc.advance('t1', 'r1'); // APPROVED -> ESCROW_HELD
    expect(prisma.store().status).toBe('ESCROW_HELD');
    expect(burnAsset).not.toHaveBeenCalled(); // no burn before payout

    await svc.advance('t1', 'r1'); // ESCROW_HELD -> FIAT_PAYOUT_PENDING
    expect(prisma.store().status).toBe('FIAT_PAYOUT_PENDING');
    expect(burnAsset).not.toHaveBeenCalled();

    await svc.advance('t1', 'r1'); // payout confirmed
    expect(prisma.store().status).toBe('FIAT_PAYOUT_CONFIRMED');

    await svc.advance('t1', 'r1'); // burn broadcast (once)
    expect(prisma.store().status).toBe('BURN_PENDING');
    expect(burnAsset).toHaveBeenCalledTimes(1);

    // burn confirmation times out → stays BURN_PENDING, not COMPLETED, no re-burn
    await expect(svc.advance('t1', 'r1')).rejects.toThrow('timeout');
    expect(prisma.store().status).toBe('BURN_PENDING');

    await svc.advance('t1', 'r1'); // BURN_CONFIRMED
    expect(prisma.store().status).toBe('BURN_CONFIRMED');
    await svc.advance('t1', 'r1'); // COMPLETED
    expect(prisma.store().status).toBe('COMPLETED');

    expect(burnAsset).toHaveBeenCalledTimes(1); // never double-burned
  });

  it('holds escrow and does not complete when payout fails', async () => {
    const prisma = statefulPrisma({
      id: 'r2', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '100',
      status: 'FIAT_PAYOUT_PENDING', payoutReference: 'PAYOUT-2',
    });
    const burnAsset = jest.fn();
    const payout = { initiatePayout: jest.fn(), getPayoutStatus: jest.fn().mockResolvedValue('FAILED') };
    const svc = build(prisma, payout, { burnAsset });
    const r = await svc.advance('t1', 'r2');
    expect(r.status).toBe('FAILED');
    expect(burnAsset).not.toHaveBeenCalled(); // funds not burned when payout fails
  });
});

/**
 * Tenant isolation on the value paths. mint.service and redemption.service loaded the wallet by
 * raw id with no tenant scope, while loadActive() on the adjacent line scoped the asset
 * correctly — so the two paths that move stablecoin value could name any wallet on the platform,
 * including another tenant's. Cross-tenant is NotFound, never 403: a 403 confirms the wallet
 * exists (§7 — no existence oracle).
 */
describe('RedemptionService — the redeemer wallet is tenant-scoped (§7)', () => {
  function build(wallet: Record<string, unknown> | null) {
    const r = {
      id: 'r1', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10',
      status: 'FIAT_PAYOUT_CONFIRMED', correlationId: 'c', bankAccountReference: 'BANK-1',
    };
    const prisma = {
      stablecoinRedemption: {
        findUnique: async () => r,
        update: async ({ data }: { data: Record<string, unknown> }) => ({ ...r, ...data }),
        updateMany: async () => ({ count: 1 }),
        findMany: async () => [],
      },
      // loadActive() include:s the config on the asset — a fixture with a separate
      // stablecoinConfig.findFirst never reaches the wallet check, which made an earlier
      // version of these tests pass on a coincidentally-matching "not found" message.
      asset: {
        findUnique: async () => ({
          id: 'a1', tenantId: 't1', assetCode: 'DKHR', status: 'ACTIVE', issuerPublicKey: 'GI',
          stablecoinConfig: { assetId: 'a1', lifecycleState: 'ACTIVE' },
        }),
      },
      wallet: { findUnique: async () => wallet },
      transaction: {
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;
    return new RedemptionService(
      prisma,
      { decrypt: () => 'S' } as never,
      { record: jest.fn() } as never,
      { requireEnabled: jest.fn() } as never,
      { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) } as never,
      { initiatePayout: jest.fn(), getPayoutStatus: jest.fn() } as never,
      { burnAsset: jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true }) } as never,
      { assertAllowed: jest.fn().mockResolvedValue(undefined) } as never,
      { refreshFromChain: jest.fn().mockResolvedValue(undefined) } as never,
    );
  }

  it("REFUSES to burn from another tenant's wallet", async () => {
    const svc = build({ id: 'w1', tenantId: 'OTHER-TENANT', status: 'ACTIVE', stellarSecretEnc: 'enc' });
    // Specifically the REDEEMER wallet message: /not found/i alone also matches "Stablecoin not
    // found", which is how this test previously passed without reaching the check at all.
    await expect(svc.advance('t1', 'r1')).rejects.toThrow(/Redeemer wallet not found/);
  });

  it('REFUSES to burn from a FROZEN wallet — freeze must reach this path too', async () => {
    const svc = build({ id: 'w1', tenantId: 't1', status: 'FROZEN', stellarSecretEnc: 'enc' });
    await expect(svc.advance('t1', 'r1')).rejects.toThrow(/FROZEN/);
  });
});

/**
 * §25 eligibility/KYC. `REQUESTED -> VALIDATING` used to set kycValidated: true unconditionally —
 * a field name asserting a check that did not exist. Worse than no field: a reviewer reading
 * "kycValidated: true" reasonably concludes someone verified something.
 */
describe('RedemptionService — KYC is validated, not asserted (§25)', () => {
  function build(opts: { wallet?: Record<string, unknown> | null; policyErr?: Error; policy?: Record<string, unknown> }) {
    const r = {
      id: 'r1', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10',
      status: 'REQUESTED', correlationId: 'c', bankAccountReference: 'BANK-1',
    };
    let rec: Record<string, unknown> = { ...r };
    const audit = { record: jest.fn() };
    const prisma = {
      stablecoinRedemption: {
        findUnique: async () => ({ ...rec }),
        update: async ({ data }: { data: Record<string, unknown> }) => { rec = { ...rec, ...data }; return { ...rec }; },
      },
      wallet: {
        findUnique: async () =>
          opts.wallet === undefined
            ? { id: 'w1', tenantId: 't1', status: 'ACTIVE', stellarSecretEnc: 'enc' }
            : opts.wallet,
      },
      transaction: {
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as never;
    const walletPolicy = {
      assertAllowed: opts.policyErr ? jest.fn().mockRejectedValue(opts.policyErr) : jest.fn().mockResolvedValue(undefined),
      resolve: jest.fn().mockResolvedValue(opts.policy ?? { kycLevel: 'STANDARD', redemptionEligible: true }),
    };
    const svc = new RedemptionService(
      prisma,
      { decrypt: () => 'S' } as never,
      audit as never,
      { requireEnabled: jest.fn() } as never,
      { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) } as never,
      { initiatePayout: jest.fn(), getPayoutStatus: jest.fn() } as never,
      { burnAsset: jest.fn() } as never,
      walletPolicy as never,
      { refreshFromChain: jest.fn().mockResolvedValue(undefined) } as never,
    );
    return { svc, audit, walletPolicy };
  }

  it('REJECTS rather than validating when the wallet has no KYC level (§27 policy refuses)', async () => {
    const { svc } = build({ policyErr: new Error('has no KYC level recorded') });
    const r = await svc.advance('t1', 'r1');
    expect(r.status).toBe('REJECTED');
    expect(r.kycValidated).toBe(false);
    // The reason survives, so the customer and an auditor know WHICH control refused.
    expect(r.failureReason).toMatch(/KYC/);
  });

  it('REJECTS a wallet belonging to another tenant at eligibility, not at burn', async () => {
    // Finding out at burn time means the fiat has already gone out.
    const { svc } = build({ wallet: { id: 'w1', tenantId: 'OTHER', status: 'ACTIVE' } });
    const r = await svc.advance('t1', 'r1');
    expect(r.status).toBe('REJECTED');
    expect(r.failureReason).toMatch(/not found for this tenant/);
  });

  it('REJECTS when the wallet is not redemption-eligible', async () => {
    const { svc } = build({ policyErr: new Error('not eligible for redemption') });
    const r = await svc.advance('t1', 'r1');
    expect(r.status).toBe('REJECTED');
  });

  it('validates only after the policy passes, and records WHICH level was relied on', async () => {
    const { svc, audit } = build({ policy: { kycLevel: 'ENHANCED', redemptionEligible: true } });
    const r = await svc.advance('t1', 'r1');
    expect(r.status).toBe('VALIDATING');
    expect(r.kycValidated).toBe(true);
    const entry = audit.record.mock.calls.find((c) => c[0].action === 'redemption.eligibility.validated');
    // "kycValidated: true" alone tells a reviewer nothing about what was verified.
    expect(entry?.[0].metadata).toMatchObject({ kycLevel: 'ENHANCED' });
  });

  it('actually consults the §27 policy for the REDEEM operation', async () => {
    const { svc, walletPolicy } = build({});
    await svc.advance('t1', 'r1');
    expect(walletPolicy.assertAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'REDEEM', walletId: 'w1', amount: '10' }),
    );
  });
});
