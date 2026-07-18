import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminTenantsService } from './admin-tenants.service';
import type { AdminContext } from '../admin-auth/admin-context';

const admin = (role = 'SUPER_ADMIN', attributes: Record<string, unknown> = {}): AdminContext => ({
  userId: 'u1',
  email: 'ops@paychain.dev',
  role,
  permissions: ['tenant:read', 'tenant:write', 'client:read', 'client:write', 'audit:read'],
  attributes,
});

function tenantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    name: 'PayKH',
    type: 'WHOLESALER',
    parentTenantId: null,
    parentTenant: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-07-18T10:00:00Z'),
    _count: { childTenants: 0, apiClients: 1, wallets: 2, assets: 3 },
    ...overrides,
  };
}

describe('AdminTenantsService', () => {
  it('creates retailer tenants only under wholesaler parents', async () => {
    const prismaMock = {
      tenant: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(tenantRow({ id: 'wh1', name: 'PayKH', type: 'WHOLESALER' })),
        create: jest.fn().mockResolvedValue(tenantRow({ id: 'ret1', name: 'Retail A', type: 'RETAILER', parentTenantId: 'wh1' })),
      },
    };
    const prisma = prismaMock as never;
    const audit = { record: jest.fn().mockResolvedValue(undefined) } as never;
    const svc = new AdminTenantsService(prisma, audit);

    const created = await svc.createRetailer(admin(), 'wh1', { name: 'Retail A' }, 'corr');
    expect(created.parentTenantId).toBe('wh1');
    expect(prismaMock.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Retail A', type: 'RETAILER', parentTenantId: 'wh1' }),
      }),
    );
  });

  it('rejects retailer creation under a non-wholesaler parent', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(tenantRow({ id: 'direct1', type: 'DIRECT', name: 'Direct Tenant' })),
      },
    } as never;
    const svc = new AdminTenantsService(prisma, { record: jest.fn() } as never);

    await expect(svc.createRetailer(admin(), 'direct1', { name: 'Retail A' }, 'corr')).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks wholesale admins from creating top-level tenants', async () => {
    const prisma = {
      tenant: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as never;
    const svc = new AdminTenantsService(prisma, { record: jest.fn() } as never);

    await expect(
      svc.create(admin('WHOLESALE_ADMIN', { tenants: ['wh1'] }), { name: 'Illegal Root', type: 'WHOLESALER' }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns downstream retailer summary for a wholesaler', async () => {
    const wholesaler = tenantRow({ id: 'wh1', name: 'PayKH', type: 'WHOLESALER', _count: { childTenants: 2, apiClients: 1, wallets: 0, assets: 0 } });
    const retailers = [
      tenantRow({ id: 'ret1', name: 'Retail A', type: 'RETAILER', parentTenantId: 'wh1', parentTenant: { id: 'wh1', name: 'PayKH' }, _count: { childTenants: 0, apiClients: 1, wallets: 2, assets: 3 } }),
      tenantRow({ id: 'ret2', name: 'Retail B', type: 'RETAILER', parentTenantId: 'wh1', parentTenant: { id: 'wh1', name: 'PayKH' }, _count: { childTenants: 0, apiClients: 2, wallets: 4, assets: 5 } }),
    ];
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(wholesaler),
        findMany: jest.fn().mockResolvedValue(retailers),
      },
    } as never;
    const svc = new AdminTenantsService(prisma, { record: jest.fn() } as never);

    const view = await svc.retailers(admin('WHOLESALE_ADMIN', { tenants: ['wh1', 'ret1', 'ret2'] }), 'wh1');
    expect(view.summary).toEqual({ retailers: 2, apiClients: 3, wallets: 6, assets: 8 });
    expect(view.items[0]?.wholesalerTenantName).toBe('PayKH');
  });

  it('rejects retailer summary for non-wholesaler tenants', async () => {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(tenantRow({ id: 't1', type: 'DIRECT', name: 'Direct Tenant' })),
      },
    } as never;
    const svc = new AdminTenantsService(prisma, { record: jest.fn() } as never);

    await expect(svc.retailers(admin(), 't1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the wholesaler tenant is missing', async () => {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as never;
    const svc = new AdminTenantsService(prisma, { record: jest.fn() } as never);

    await expect(svc.retailers(admin(), 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
