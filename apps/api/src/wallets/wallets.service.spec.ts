import { NotFoundException } from '@nestjs/common';
import { WalletsService } from './wallets.service';

/**
 * M0 exit-gate test (§7): cross-tenant access must be blocked. A wallet owned by tenant A
 * must be invisible to tenant B — surfaced as NotFound, never leaking existence.
 */
describe('WalletsService — tenant isolation', () => {
  const walletOwnedByTenantA = {
    id: 'w1',
    tenantId: 'tenant-A',
    stellarAccountId: 'GA...',
    ownerType: 'CUSTOMER',
    ownerReference: 'ref',
    status: 'ACTIVE',
    createdAt: new Date(),
  };

  function buildService(findUnique: jest.Mock): WalletsService {
    const prisma = { wallet: { findUnique } } as never;
    const crypto = {} as never;
    const audit = {} as never;
    const balances = {} as never;
    const chain = {} as never;
    return new WalletsService(prisma, crypto, audit, balances, chain);
  }

  it('returns the wallet to its owning tenant', async () => {
    const svc = buildService(jest.fn().mockResolvedValue(walletOwnedByTenantA));
    await expect(svc.getOwned('tenant-A', 'w1')).resolves.toMatchObject({ id: 'w1' });
  });

  it('hides a wallet from a different tenant (NotFound)', async () => {
    const svc = buildService(jest.fn().mockResolvedValue(walletOwnedByTenantA));
    await expect(svc.getOwned('tenant-B', 'w1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns NotFound for a missing wallet', async () => {
    const svc = buildService(jest.fn().mockResolvedValue(null));
    await expect(svc.getOwned('tenant-A', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
