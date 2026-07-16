import { AdminReadService } from './admin-read.service';
import { STABLECOIN_FLAGS } from '../feature-flags/feature-flags.constants';

/**
 * The admin console is cross-tenant and read-only. These tests pin the two pieces of real
 * logic: (1) feature flags surface every declared stablecoin.* flag as effectively OFF even
 * with no DB row (the §36 "default OFF" invariant must be visible, not implied), and
 * (2) models that store only a tenantId are enriched with the tenant's human name.
 */
describe('AdminReadService', () => {
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
    const svc = new AdminReadService(prisma);

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
    const svc = new AdminReadService(prisma);

    const { items } = await svc.treasury(null);
    expect(items[0]?.tenant).toBe('PayKH Sandbox');
    // Unknown tenant id falls back to the raw id rather than crashing or showing blank.
    expect(items[1]?.tenant).toBe('unknown');
  });

  it('builds a case-insensitive OR search filter for wallets and passes it to prisma', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = { wallet: { findMany } } as never;
    const svc = new AdminReadService(prisma);

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
    const svc = new AdminReadService(prisma);

    const res = await svc.wallets(null, '   ');
    expect(findMany.mock.calls[0][0].where).toEqual({});
    expect(res.query).toBeNull();
  });
});
