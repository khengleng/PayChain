import { ReconciliationService } from './reconciliation.service';

/**
 * M1 exit gate (§31): a deliberately injected mismatch surfaces as a reconciliation
 * exception and is never silently fixed; a matching record produces none; and an
 * already-open exception is not duplicated.
 */
describe('ReconciliationService', () => {
  const confirmedTx = {
    id: 'tx1',
    tenantId: 't1',
    status: 'CONFIRMED',
    blockchainHash: 'HASH',
    correlationId: 'corr1',
  };

  function build(chainStatus: string, existing: { id: string } | null, create: jest.Mock) {
    const prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue([confirmedTx]) },
      reconciliationException: {
        findFirst: jest.fn().mockResolvedValue(existing),
        create,
      },
    } as never;
    const chain = {
      getTransaction: jest.fn().mockResolvedValue({ transactionHash: 'HASH', status: chainStatus }),
    } as never;
    return new ReconciliationService(prisma, chain);
  }

  it('opens an exception when the chain does not corroborate a CONFIRMED record', async () => {
    const create = jest.fn().mockResolvedValue({});
    const res = await build('not_found', null, create).run();
    expect(res.exceptions).toBe(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: 'MISSING_CONFIRMATION', transactionId: 'tx1' }),
      }),
    );
  });

  it('records no exception when record and chain agree', async () => {
    const create = jest.fn();
    const res = await build('confirmed', null, create).run();
    expect(res.exceptions).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not duplicate an already-open exception', async () => {
    const create = jest.fn();
    const res = await build('not_found', { id: 'exc1' }, create).run();
    expect(res.exceptions).toBe(0);
    expect(create).not.toHaveBeenCalled();
  });
});
