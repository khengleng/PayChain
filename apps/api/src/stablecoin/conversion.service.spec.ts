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
    wallet: { findUnique: async () => ({ id: 'w1', stellarAccountId: 'GW', stellarSecretEnc: 'encw' }) },
  };
}

function build(prisma: unknown, chain: unknown) {
  return new ConversionService(
    prisma as never,
    { decrypt: () => 'S' } as never,
    { record: jest.fn() } as never,
    { requireEnabled: jest.fn() } as never,
    chain as never,
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
