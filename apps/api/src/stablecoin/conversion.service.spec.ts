import { ConversionService } from './conversion.service';

const FROM = { id: 'loy', tenantId: 't1', assetCode: 'PTS', issuerPublicKey: 'GPTS', issuerSecretEnc: 'encp' };
const TO = { id: 'usd', tenantId: 't1', assetCode: 'USDX', issuerPublicKey: 'GUSD', issuerSecretEnc: 'encu' };

function statefulPrisma(initial: Record<string, unknown>) {
  let rec: Record<string, unknown> = { ...initial };
  const assets: Record<string, unknown> = { loy: FROM, usd: TO };
  return {
    store: () => rec,
    stablecoinConversion: {
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
    asset: { findUnique: async ({ where }: { where: { id: string } }) => assets[where.id] },
    wallet: { findUnique: async () => ({ id: 'w1', tenantId: 't1', status: 'ACTIVE', stellarAccountId: 'GW', stellarSecretEnc: 'encw' }) },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    // Conversion now records its mint so the supply is visible to the reserve calculation.
    stablecoinMintRequest: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'mr1', ...data }),
    },
  };
}

function build(prisma: unknown, chain: unknown) {
  return new ConversionService(
    prisma as never,
    { decrypt: () => 'S' } as never,
    { record: jest.fn() } as never,
    { requireEnabled: jest.fn() } as never,
    chain as never,
    // Permissive: these tests cover conversion's own saga. The mint guards and §27
    // policy have their own tests; a conversion-specific test for each is below.
    { assertMintAllowed: jest.fn().mockResolvedValue(undefined) } as never,
    { assertAllowed: jest.fn().mockResolvedValue(undefined) } as never,
    { refreshFromChain: jest.fn().mockResolvedValue(undefined) } as never,
    { consume: jest.fn().mockResolvedValue(undefined) } as never,
  );
}

describe('ConversionService saga (§26)', () => {
  it('burns points then mints stablecoin (not a simple balance update)', async () => {
    const prisma = statefulPrisma({ id: 'c1', tenantId: 't1', fromAssetId: 'loy', toAssetId: 'usd', walletId: 'w1', pointsAmount: '100', stablecoinAmount: '1', status: 'CONFIRMED' });
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'PB', submitted: true });
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'M', submitted: true });
    const getTransaction = jest.fn().mockResolvedValue({ status: 'confirmed' });
    const svc = build(prisma, { burnAsset, issueAsset, getTransaction });

    await svc.advance('t1', 'c1'); // burn points
    expect(prisma.store().status).toBe('POINTS_BURN_PENDING');
    await svc.advance('t1', 'c1'); // confirm burn
    expect(prisma.store().status).toBe('POINTS_BURNED');
    await svc.advance('t1', 'c1'); // mint stablecoin
    expect(prisma.store().status).toBe('COMPLETED');

    expect(burnAsset).toHaveBeenCalledTimes(1);
    expect(issueAsset).toHaveBeenCalledWith(expect.objectContaining({ assetCode: 'USDX', amount: '1' }));
  });

  it('compensates (re-issues points) when the mint leg fails after burn', async () => {
    const prisma = statefulPrisma({ id: 'c2', tenantId: 't1', fromAssetId: 'loy', toAssetId: 'usd', walletId: 'w1', pointsAmount: '100', stablecoinAmount: '1', status: 'POINTS_BURNED' });
    const issueAsset = jest
      .fn()
      .mockRejectedValueOnce(new Error('mint failed')) // stablecoin mint fails
      .mockResolvedValueOnce({ transactionHash: 'REISSUE', submitted: true }); // compensation re-issue
    const svc = build(prisma, { issueAsset, burnAsset: jest.fn(), getTransaction: jest.fn() });

    await svc.advance('t1', 'c2'); // mint fails -> COMPENSATING
    expect(prisma.store().status).toBe('COMPENSATING');
    await svc.advance('t1', 'c2'); // re-issue points -> COMPENSATED
    expect(prisma.store().status).toBe('COMPENSATED');

    // second issueAsset call re-issued the loyalty points back to the customer
    expect(issueAsset).toHaveBeenLastCalledWith(expect.objectContaining({ assetCode: 'PTS', amount: '100' }));
  });

  it('rejects confirming an expired quote', async () => {
    const past = new Date(Date.now() - 60_000);
    const prisma = statefulPrisma({ id: 'c3', tenantId: 't1', status: 'QUOTED', quoteExpiresAt: past });
    const svc = build(prisma, {});
    const res = await svc.confirm({ tenantId: 't1', clientId: 'x', scopes: [] }, 'c3');
    expect(res.status).toBe('FAILED');
    expect(res.failureReason).toContain('expired');
  });
});

/**
 * §22/§23/§26. Conversion used to call chain.issueAsset directly, skipping every control the
 * mint saga applies — a second, uncontrolled way to create stablecoin, contained only by a
 * disabled flag. Burning loyalty points creates no reserve, so a converted token still has to be
 * backed like any other.
 */
describe('ConversionService — cannot mint around the mint controls (§26)', () => {
  const QUOTE = {
    id: 'c1', tenantId: 't1', fromAssetId: 'pts', toAssetId: 'sc', walletId: 'w1',
    pointsAmount: '100', stablecoinAmount: '10', status: 'POINTS_BURNED',
    correlationId: 'corr', expiresAt: new Date(Date.now() + 60_000),
  };

  function build(overrides: { assertMintAllowed?: jest.Mock; assertAllowed?: jest.Mock; issueAsset?: jest.Mock }) {
    let rec: Record<string, unknown> = { ...QUOTE };
    const createMint = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'mr1', ...data }));
    const prisma = {
      stablecoinConversion: {
        findUnique: async () => ({ ...rec }),
        update: async ({ data }: { data: Record<string, unknown> }) => { rec = { ...rec, ...data }; return { ...rec }; },
        updateMany: async ({ where, data }: { where: { status: string }; data: Record<string, unknown> }) => {
          if (rec.status === where.status) { rec = { ...rec, ...data }; return { count: 1 }; }
          return { count: 0 };
        },
      },
      asset: {
        findUnique: async () => ({
          id: 'sc', tenantId: 't1', assetCode: 'DKHR', status: 'ACTIVE',
          issuerPublicKey: 'GI', issuerSecretEnc: 'enc',
        }),
      },
      wallet: { findUnique: async () => ({ id: 'w1', tenantId: 't1', status: 'ACTIVE', stellarAccountId: 'GW' }) },
      transaction: {
        create: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      stablecoinMintRequest: { create: createMint },
    } as never;

    const issueAsset = overrides.issueAsset ?? jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const svc = new ConversionService(
      prisma,
      { decrypt: () => 'S' } as never,
      { record: jest.fn() } as never,
      { requireEnabled: jest.fn() } as never,
      { issueAsset } as never,
      { assertMintAllowed: overrides.assertMintAllowed ?? jest.fn().mockResolvedValue(undefined) } as never,
      { assertAllowed: overrides.assertAllowed ?? jest.fn().mockResolvedValue(undefined) } as never,
      { refreshFromChain: jest.fn().mockResolvedValue(undefined) } as never,
      { consume: jest.fn().mockResolvedValue(undefined) } as never,
    );
    return { svc, issueAsset, createMint, store: () => rec };
  }

  it('REFUSES to convert when the mint would breach the reserve target', async () => {
    const assertMintAllowed = jest.fn().mockRejectedValue(new Error('would breach reserve target'));
    const { svc, issueAsset } = build({ assertMintAllowed });
    // The compensation path catches the throw, so assert on the effect: no tokens were created.
    await svc.advance('t1', 'c1').catch(() => undefined);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('REFUSES to convert into a wallet that is not stablecoin-enabled (§27)', async () => {
    const assertAllowed = jest.fn().mockRejectedValue(new Error('not stablecoin-enabled'));
    const { svc, issueAsset } = build({ assertAllowed });
    await svc.advance('t1', 'c1').catch(() => undefined);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('applies the SAME guard the mint saga uses, with the conversion as the subject', async () => {
    const assertMintAllowed = jest.fn().mockResolvedValue(undefined);
    const { svc } = build({ assertMintAllowed });
    await svc.advance('t1', 'c1');
    expect(assertMintAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 't1', assetId: 'sc', amount: '10', resourceType: 'stablecoin_conversion' }),
    );
  });

  it('records the mint so converted supply is VISIBLE to the reserve ratio', async () => {
    // Without this row, ReserveService.getState sums no supply for converted tokens and the
    // reserve silently over-reports its own coverage.
    const { svc, createMint, store } = build({});
    await svc.advance('t1', 'c1');
    expect(createMint).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        assetId: 'sc', amount: '10', status: 'CONFIRMED',
        blockchainHash: 'H', fundingReference: 'conversion:c1',
      }),
    }));
    expect(store().mintRequestId).toBe('mr1'); // the link field that was never written
  });
});
