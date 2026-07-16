import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AdminActionsService } from './admin-actions.service';

/**
 * The privileged admin writes must respect the platform's safety invariants: wallet unfreeze
 * only from FROZEN, the mainnet flag can never be raw-enabled, tenant-scoped admins cannot
 * touch the GLOBAL default, and every mutation is audited.
 */
function admin(attributes: Record<string, unknown> = {}) {
  return { userId: 'u1', email: 'ops@paychain', role: 'OPERATIONS_ADMIN', permissions: [], attributes } as never;
}

describe('AdminActionsService', () => {
  function build(walletStatus = 'ACTIVE') {
    const wallet = { id: 'w1', tenantId: 't1', status: walletStatus };
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
        update: jest.fn().mockImplementation(({ data }: { data: { status: string } }) => Promise.resolve({ id: 'w1', status: data.status })),
      },
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const flags = { set: jest.fn().mockResolvedValue(undefined) };
    const treasury = { adminApprove: jest.fn(), adminReject: jest.fn() };
    const svc = new AdminActionsService(prisma as never, audit as never, flags as never, treasury as never);
    return { svc, prisma, audit, flags, wallet };
  }

  it('freezes an active wallet and audits it', async () => {
    const { svc, prisma, audit } = build('ACTIVE');
    const res = await svc.setWalletFrozen(admin(), 'w1', true, 'corr');
    expect(res.status).toBe('FROZEN');
    expect(prisma.wallet.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'FROZEN' } }));
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'wallet.freeze', tenantId: 't1' }));
  });

  it('refuses to unfreeze a wallet that is not FROZEN', async () => {
    const { svc } = build('SUSPENDED');
    await expect(svc.setWalletFrozen(admin(), 'w1', false, 'corr')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces ABAC — a tenant-scoped admin cannot freeze a wallet outside their tenants', async () => {
    const { svc } = build('ACTIVE');
    await expect(svc.setWalletFrozen(admin({ tenants: ['other'] }), 'w1', true, 'corr')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('never lets the mainnet flag be raw-enabled', async () => {
    const { svc, flags } = build();
    await expect(
      svc.setFlag(admin(), { key: 'stablecoin.mainnet.enabled', enabled: true }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(flags.set).not.toHaveBeenCalled();
  });

  it('rejects unknown flag keys', async () => {
    const { svc } = build();
    await expect(svc.setFlag(admin(), { key: 'not.a.flag', enabled: true }, 'corr')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a global admin enable a normal flag and audits it', async () => {
    const { svc, flags, audit } = build();
    const res = await svc.setFlag(admin(), { key: 'stablecoin.minting.enabled', enabled: true }, 'corr');
    expect(res).toEqual({ key: 'stablecoin.minting.enabled', scope: 'GLOBAL', enabled: true });
    expect(flags.set).toHaveBeenCalledWith('stablecoin.minting.enabled', true, 'GLOBAL', 'ops@paychain');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'feature_flag.set' }));
  });

  it('forbids a tenant-scoped admin from changing the GLOBAL default', async () => {
    const { svc } = build();
    await expect(
      svc.setFlag(admin({ tenants: ['t1'] }), { key: 'stablecoin.minting.enabled', enabled: false }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
