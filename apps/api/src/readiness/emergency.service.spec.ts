import { ForbiddenException } from '@nestjs/common';
import { EmergencyService } from './emergency.service';

describe('EmergencyService (§37)', () => {
  function build(overrides: {
    flagSet?: jest.Mock;
    walletUpdate?: jest.Mock;
    assertReady?: jest.Mock;
  }) {
    const prisma = {
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1' }),
        update: overrides.walletUpdate ?? jest.fn(),
      },
      emergencyControlEvent: { create: jest.fn().mockResolvedValue({ id: 'e1' }) },
    } as never;
    const flags = { set: overrides.flagSet ?? jest.fn() } as never;
    const audit = { record: jest.fn() } as never;
    const readiness = { assertProductionReady: overrides.assertReady ?? jest.fn() } as never;
    return new EmergencyService(prisma, flags, audit, readiness);
  }

  const auth = { tenantId: 't1', clientId: 'ops', scopes: [] };

  it('suspends minting by disabling the flag and records the action', async () => {
    const flagSet = jest.fn();
    const svc = build({ flagSet });
    await svc.execute(auth, { action: 'SUSPEND_MINTING', reason: 'incident-123' }, 'corr');
    expect(flagSet).toHaveBeenCalledWith('stablecoin.minting.enabled', false, 'GLOBAL', 'ops');
  });

  it('freezes a wallet owned by the tenant', async () => {
    const walletUpdate = jest.fn();
    const svc = build({ walletUpdate });
    await svc.execute(auth, { action: 'FREEZE_WALLET', targetId: 'w1', reason: 'fraud' }, 'corr');
    expect(walletUpdate).toHaveBeenCalledWith({ where: { id: 'w1' }, data: { status: 'FROZEN' } });
  });

  it('requires a reason', async () => {
    const svc = build({});
    await expect(svc.execute(auth, { action: 'SUSPEND_MINTING', reason: '' }, 'corr')).rejects.toThrow();
  });

  it('blocks enabling mainnet writes until readiness passes (§0.2)', async () => {
    const flagSet = jest.fn();
    const assertReady = jest.fn().mockRejectedValue(new ForbiddenException('blocked'));
    const svc = build({ flagSet, assertReady });
    await expect(svc.enableMainnetWrites(auth, 'corr')).rejects.toBeInstanceOf(ForbiddenException);
    expect(flagSet).not.toHaveBeenCalled(); // mainnet flag never turned on
  });
});
