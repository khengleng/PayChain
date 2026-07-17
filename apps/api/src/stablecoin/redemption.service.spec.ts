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
    } as never;
    return new RedemptionService(
      prisma,
      { decrypt: () => 'S' } as never,
      { record: jest.fn() } as never,
      { requireEnabled: jest.fn() } as never,
      { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) } as never,
      { initiatePayout: jest.fn(), getPayoutStatus: jest.fn() } as never,
      { burnAsset: jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true }) } as never,
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
