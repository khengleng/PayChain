import { AdminReadService } from './admin-read.service';
import { STABLECOIN_FLAGS } from '../feature-flags/feature-flags.constants';

/**
 * The admin console is cross-tenant and read-only. These tests pin the two pieces of real
 * logic: (1) feature flags surface every declared stablecoin.* flag as effectively OFF even
 * with no DB row (the §36 "default OFF" invariant must be visible, not implied), and
 * (2) models that store only a tenantId are enriched with the tenant's human name.
 */
describe('AdminReadService', () => {
  const readiness: { summary: jest.Mock } = { summary: jest.fn() };

  it('shows every declared stablecoin flag as OFF by default and separates tenant overrides', async () => {
    const prisma = {
      tenant: { findMany: jest.fn().mockResolvedValue([{ id: 't1', name: 'PayKH Sandbox' }]) },
      featureFlag: {
        findMany: jest.fn().mockResolvedValue([
          // one global flag explicitly enabled
          { tenantId: 'GLOBAL', key: 'stablecoin.module.enabled', enabled: true, updatedBy: 'root', updatedAt: new Date('2026-01-01') },
          // a per-tenant override
          { tenantId: 't1', key: 'stablecoin.minting.enabled', enabled: true, updatedBy: 'ops', updatedAt: new Date('2026-01-02') },
        ]),
      },
    } as never;
    const svc = new AdminReadService(prisma, readiness as any, { tieOut: jest.fn() } as any);

    const { global, overrides } = await svc.flags(null);

    // Every declared flag is present in the global view.
    expect(global).toHaveLength(STABLECOIN_FLAGS.length);
    const module = global.find((f) => f.key === 'stablecoin.module.enabled');
    expect(module).toMatchObject({ enabled: true, seeded: true });
    // A flag with no DB row is effectively OFF and marked unseeded.
    const minting = global.find((f) => f.key === 'stablecoin.minting.enabled');
    expect(minting).toMatchObject({ enabled: false, seeded: false });

    // The tenant override is not mixed into the global list; it's enriched with the tenant name.
    expect(overrides).toEqual([
      expect.objectContaining({ tenant: 'PayKH Sandbox', key: 'stablecoin.minting.enabled', enabled: true }),
    ]);
  });

  it('enriches tenantId-only models with the tenant name and falls back to the id', async () => {
    const prisma = {
      tenant: { findMany: jest.fn().mockResolvedValue([{ id: 't1', name: 'PayKH Sandbox' }]) },
      treasuryMovement: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'm1', tenantId: 't1', fromAccount: 'A', toAccount: 'B', amount: '10', purpose: 'rebalance', status: 'PENDING_APPROVAL', createdBy: 'maker', approvedBy: null, executedAt: null, createdAt: new Date() },
          { id: 'm2', tenantId: 'unknown', fromAccount: 'A', toAccount: 'B', amount: '5', purpose: 'x', status: 'PENDING_APPROVAL', createdBy: 'maker', approvedBy: null, executedAt: null, createdAt: new Date() },
        ]),
      },
    } as never;
    const svc = new AdminReadService(prisma, readiness as any, { tieOut: jest.fn() } as any);

    const { items } = await svc.treasury(null);
    expect(items[0]?.tenant).toBe('PayKH Sandbox');
    // Unknown tenant id falls back to the raw id rather than crashing or showing blank.
    expect(items[1]?.tenant).toBe('unknown');
  });

  it('builds a case-insensitive OR search filter for wallets and passes it to prisma', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { wallet: { findMany } } as never;
    const svc = new AdminReadService(prisma, readiness as any, { tieOut: jest.fn() } as any);

    await svc.wallets(null, '  GABC  ');

    const arg = findMany.mock.calls[0][0];
    expect(arg.where.OR).toEqual([
      { ownerReference: { contains: 'GABC', mode: 'insensitive' } },
      { stellarAccountId: { contains: 'GABC', mode: 'insensitive' } },
    ]);
    expect(arg.take).toBe(200);
  });

  it('applies no filter when the wallet search query is empty', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { wallet: { findMany } } as never;
    const svc = new AdminReadService(prisma, readiness as any, { tieOut: jest.fn() } as any);

    const res = await svc.wallets(null, '   ');
    expect(findMany.mock.calls[0][0].where).toEqual({});
    expect(res.query).toBeNull();
  });

  it('builds a permission-scoped overview from live counts and readiness summary', async () => {
    readiness.summary = jest.fn().mockResolvedValue({
      productionReady: false,
      mandatoryPassed: 3,
      mandatoryTotal: 5,
      blockedBy: ['security.pen_test', 'operations.incident_drill'],
    });

    const prisma: any = {
      tenant: { count: jest.fn().mockResolvedValue(2) },
      wallet: { count: jest.fn().mockResolvedValue(11) },
      asset: { count: jest.fn().mockResolvedValue(4) },
      stablecoinConfig: { count: jest.fn().mockResolvedValue(1) },
      reserveAccount: { count: jest.fn().mockResolvedValue(2) },
      treasuryMovement: { count: jest.fn().mockResolvedValue(3) },
      monitoringAlert: { count: jest.fn().mockResolvedValue(5) },
      reconciliationException: { count: jest.fn().mockResolvedValue(7) },
      featureFlag: { count: jest.fn().mockResolvedValue(9) },
      auditLog: { count: jest.fn().mockResolvedValue(13) },
    } as never;

    const svc = new AdminReadService(prisma, readiness as any, { tieOut: jest.fn() } as any);
    const overview = await svc.overview(['tenant-a', 'tenant-b'], [
      'tenant:read',
      'wallet:read',
      'asset:read',
      'stablecoin:read',
      'reserve:read',
      'treasury:read',
      'compliance:read',
      'reconciliation:read',
      'flags:read',
      'audit:read',
      'readiness:read',
    ]);

    expect(overview.readiness).toEqual({
      productionReady: false,
      mandatoryPassed: 3,
      mandatoryTotal: 5,
      blockedBy: ['security.pen_test', 'operations.incident_drill'],
    });
    expect(overview.counts).toEqual({
      tenants: 2,
      wallets: 11,
      assets: 4,
      stablecoins: 1,
      reserveAccounts: 2,
      treasuryPending: 3,
      complianceOpen: 5,
      reconciliationOpen: 7,
      flagOverrides: 9,
      recentAuditEvents: 13,
    });
    expect(prisma.tenant.count).toHaveBeenCalledWith({ where: { id: { in: ['tenant-a', 'tenant-b'] } } });
    expect(prisma.reconciliationException.count).toHaveBeenCalledWith({
      where: { tenantId: { in: ['tenant-a', 'tenant-b'] }, status: 'OPEN' },
    });
  });
});
