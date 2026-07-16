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

/**
 * Structuring (§19). The threshold used to gate on the single amount, so a large transaction
 * could be reversed in slices that each sat just below it — every slice unapproved, the whole
 * original drained, no checker ever involved. The codebase names this attack in
 * monitoring.service.ts (`structuring`) and did not consult it here.
 *
 * The threshold is now measured against the cumulative amount reversed against the original.
 */
describe('CompensationService — structuring is blocked (§19)', () => {
  const original = {
    id: 'orig-1',
    tenantId: 't1',
    type: 'ASSET_ISSUED',
    status: 'CONFIRMED',
    assetId: 'a1',
    amount: '500000',
    destinationWalletId: 'w1',
  };
  const auth = { tenantId: 't1', clientId: 'maker-1', scopes: [] };

  /** `priorReversed` models compensations already recorded against this original. */
  function build(priorReversed: string[], create = jest.fn().mockResolvedValue({ id: 'c1', status: 'APPROVAL_REQUIRED' })) {
    const prisma = {
      transaction: {
        findUnique: jest.fn().mockResolvedValue(original),
        findMany: jest.fn().mockResolvedValue(priorReversed.map((amount) => ({ amount }))),
        create,
        update: jest.fn(),
      },
      wallet: { findUnique: jest.fn() },
      asset: { findUnique: jest.fn() },
    } as never;
    return new CompensationService(
      prisma,
      {} as never, // wallets — only reached on the execute path
      {} as never, // balances
      { record: jest.fn() } as never, // audit
      { emit: jest.fn() } as never, // webhooks
      { COMPENSATION_APPROVAL_THRESHOLD: 100000 } as never,
      {} as never, // chain
    );
  }

  it('still routes a single over-threshold reversal to approval', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'c1', status: 'APPROVAL_REQUIRED' });
    const svc = build([], create);
    await svc.compensate(auth, 'orig-1', { amount: '100000', reason: 'REFUND' }, 'corr');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVAL_REQUIRED' }),
    }));
  });

  it('THE ATTACK: a second sub-threshold slice now trips approval cumulatively', async () => {
    // 99,999 already reversed; another 99,999 is individually under the threshold but takes the
    // cumulative to 199,998 — well past it. Previously this executed with no checker.
    const create = jest.fn().mockResolvedValue({ id: 'c2', status: 'APPROVAL_REQUIRED' });
    const svc = build(['99999'], create);
    await svc.compensate(auth, 'orig-1', { amount: '99999', reason: 'REFUND' }, 'corr');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVAL_REQUIRED' }),
    }));
  });

  it('trips exactly at the boundary when slices sum to the threshold', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'c2', status: 'APPROVAL_REQUIRED' });
    const svc = build(['50000'], create);
    await svc.compensate(auth, 'orig-1', { amount: '50000', reason: 'REFUND' }, 'corr');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVAL_REQUIRED' }),
    }));
  });

  it('leaves genuinely small reversals unblocked — the rule must not stop ordinary refunds', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'c1', status: 'APPROVAL_REQUIRED' });
    const svc = build(['10'], create);
    // 10 + 5 = 15, nowhere near 100000: this must NOT be routed to approval.
    await expect(
      svc.compensate(auth, 'orig-1', { amount: '5', reason: 'REFUND' }, 'corr'),
    ).rejects.toThrow(); // executeReversal needs chain deps this fake lacks — proves it took the
                        // execute path rather than creating an APPROVAL_REQUIRED row.
    expect(create).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVAL_REQUIRED' }),
    }));
  });

  it('uses fixed-point comparison, not floats, at the boundary', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'c2', status: 'APPROVAL_REQUIRED' });
    const svc = build(['99999.9999999'], create);
    await svc.compensate(auth, 'orig-1', { amount: '0.0000001', reason: 'REFUND' }, 'corr');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVAL_REQUIRED' }),
    }));
  });
});
