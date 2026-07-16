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

/**
 * Freeze must actually stop money moving. requireSecret is the chokepoint: every value path
 * (issue, transfer, redeem, burn) needs a signing key, and issue/transfer call it for BOTH the
 * source and the destination — so a frozen wallet can neither send nor receive.
 */
describe('WalletsService — frozen wallets cannot transact (§37)', () => {
  function build(status: string) {
    const wallet = {
      id: 'w1',
      tenantId: 't1',
      stellarAccountId: 'GA...',
      stellarSecretEnc: 'enc',
      status,
    };
    const prisma = { wallet: { findUnique: jest.fn().mockResolvedValue(wallet) } } as never;
    const crypto = { decrypt: jest.fn().mockReturnValue('SECRET') } as never;
    return {
      svc: new WalletsService(prisma, crypto, {} as never, {} as never, {} as never),
      crypto,
    };
  }

  it('refuses to hand out a signing key for a FROZEN wallet', async () => {
    const { svc, crypto } = build('FROZEN');
    await expect(svc.requireSecret('t1', 'w1')).rejects.toThrow(/FROZEN/);
    // The secret must not even be decrypted — a refusal that still touches the key is a leak
    // waiting to happen if the caller ignores the throw.
    expect((crypto as unknown as { decrypt: jest.Mock }).decrypt).not.toHaveBeenCalled();
  });

  it('refuses for SUSPENDED / CLOSED wallets too', async () => {
    for (const s of ['SUSPENDED', 'CLOSED']) {
      const { svc } = build(s);
      await expect(svc.requireSecret('t1', 'w1')).rejects.toThrow(new RegExp(s));
    }
  });

  it('still returns the key for an ACTIVE wallet', async () => {
    const { svc } = build('ACTIVE');
    await expect(svc.requireSecret('t1', 'w1')).resolves.toMatchObject({ secret: 'SECRET' });
  });

  it('still lets a frozen wallet be READ — freezing stops value, it is not a gag', async () => {
    const { svc } = build('FROZEN');
    await expect(svc.getOwned('t1', 'w1')).resolves.toMatchObject({ id: 'w1', status: 'FROZEN' });
  });
});
