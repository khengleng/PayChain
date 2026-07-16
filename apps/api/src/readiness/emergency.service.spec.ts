import { ForbiddenException } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import type { AdminContext } from '../admin-auth/admin-context';

function admin(attributes: Record<string, unknown> = {}): AdminContext {
  return { userId: 'u1', email: 'ops@paychain.dev', role: 'SECURITY_ADMIN', permissions: [], attributes };
}

describe('EmergencyService (§37, RBAC/ABAC)', () => {
  function build(overrides: {
    flagSet?: jest.Mock;
    walletUpdate?: jest.Mock;
    walletTenantId?: string;
    assertReady?: jest.Mock;
  }) {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'w1', tenantId: overrides.walletTenantId ?? 't1' }),
        update: overrides.walletUpdate ?? jest.fn(),
      },
      emergencyControlEvent: { create: jest.fn().mockResolvedValue({ id: 'e1' }) },
    } as never;
    const flags = { set: overrides.flagSet ?? jest.fn() } as never;
    const audit = { record: jest.fn() } as never;
    const readiness = { assertProductionReady: overrides.assertReady ?? jest.fn() } as never;
    return new EmergencyService(prisma, flags, audit, readiness);
  }

  it('suspends minting by disabling the flag, attributed to the admin email', async () => {
    const flagSet = jest.fn();
    const svc = build({ flagSet });
    await svc.execute(admin(), { action: 'SUSPEND_MINTING', reason: 'incident-123' }, 'corr');
    expect(flagSet).toHaveBeenCalledWith('stablecoin.minting.enabled', false, 'GLOBAL', 'ops@paychain.dev');
  });

  it('freezes a wallet when the admin is unscoped (ABAC allows)', async () => {
    const walletUpdate = jest.fn();
    const svc = build({ walletUpdate });
    await svc.execute(admin(), { action: 'FREEZE_WALLET', targetId: 'w1', reason: 'fraud' }, 'corr');
    expect(walletUpdate).toHaveBeenCalledWith({ where: { id: 'w1' }, data: { status: 'FROZEN' } });
  });

  it('ABAC blocks freezing a wallet outside the admin tenant scope', async () => {
    const walletUpdate = jest.fn();
    // admin scoped to tenant 't-other'; wallet belongs to 't1'.
    const svc = build({ walletUpdate, walletTenantId: 't1' });
    await expect(
      svc.execute(admin({ tenants: ['t-other'] }), { action: 'FREEZE_WALLET', targetId: 'w1', reason: 'x' }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(walletUpdate).not.toHaveBeenCalled();
  });

  it('requires a reason', async () => {
    const svc = build({});
    await expect(svc.execute(admin(), { action: 'SUSPEND_MINTING', reason: '' }, 'corr')).rejects.toThrow();
  });

  it('blocks enabling mainnet writes until readiness passes (§0.2)', async () => {
    const flagSet = jest.fn();
    const assertReady = jest.fn().mockRejectedValue(new ForbiddenException('blocked'));
    const svc = build({ flagSet, assertReady });
    await expect(svc.enableMainnetWrites('ops@paychain.dev', 'corr')).rejects.toBeInstanceOf(ForbiddenException);
    expect(flagSet).not.toHaveBeenCalled();
  });
});
