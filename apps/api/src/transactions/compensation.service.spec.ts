import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CompensationService } from './compensation.service';

/**
 * M2 compensation rules (§19): threshold → maker-checker approval; over-compensation
 * rejected; maker cannot approve their own compensation.
 */
describe('CompensationService', () => {
  const auth = { tenantId: 't1', clientId: 'maker-1', scopes: [] };
  const originalIssue = {
    id: 'orig-1',
    tenantId: 't1',
    type: 'ASSET_ISSUED',
    status: 'CONFIRMED',
    assetId: 'a1',
    amount: '1000',
    destinationWalletId: 'w1',
  };

  function build(overrides: {
    findUnique?: jest.Mock;
    findMany?: jest.Mock;
    create?: jest.Mock;
    update?: jest.Mock;
    threshold?: number;
  }) {
    const prisma = {
      transaction: {
        findUnique: overrides.findUnique ?? jest.fn().mockResolvedValue(originalIssue),
        findMany: overrides.findMany ?? jest.fn().mockResolvedValue([]),
        create: overrides.create ?? jest.fn().mockResolvedValue({ id: 'comp-1', status: 'APPROVAL_REQUIRED' }),
        update: overrides.update ?? jest.fn(),
      },
      asset: { findUnique: jest.fn() },
    } as never;
    const cfg = { COMPENSATION_APPROVAL_THRESHOLD: overrides.threshold ?? 500 } as never;
    return new CompensationService(
      prisma,
      {} as never, // wallets
      {} as never, // balances
      { record: jest.fn() } as never, // audit
      { emit: jest.fn() } as never, // webhooks
      cfg,
      {} as never, // chain
    );
  }

  it('routes an at/above-threshold reversal to APPROVAL_REQUIRED without touching the chain', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'comp-1', status: 'APPROVAL_REQUIRED' });
    const svc = build({ create, threshold: 500 });
    const res = await svc.compensate(auth, 'orig-1', { amount: '600', reason: 'FRAUD' }, 'corr');
    expect(res.status).toBe('APPROVAL_REQUIRED');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVAL_REQUIRED', createdBy: 'maker-1' }),
      }),
    );
  });

  it('rejects compensation exceeding the remaining amount', async () => {
    // 800 already compensated + 300 new > 1000 original.
    const findMany = jest.fn().mockResolvedValue([{ amount: '800' }]);
    const svc = build({ findMany, threshold: 100000 });
    await expect(
      svc.compensate(auth, 'orig-1', { amount: '300', reason: 'REFUND' }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids the maker from approving their own compensation', async () => {
    const pendingComp = {
      id: 'comp-1',
      tenantId: 't1',
      type: 'COMPENSATING_TRANSACTION',
      status: 'APPROVAL_REQUIRED',
      amount: '600',
      compensatesTransactionId: 'orig-1',
      createdBy: 'maker-1',
    };
    const findUnique = jest.fn().mockResolvedValue(pendingComp);
    const svc = build({ findUnique });
    await expect(svc.approve(auth, 'comp-1', 'corr')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
