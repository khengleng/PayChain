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

/**
 * A single unqueryable transaction used to throw out of the loop and abort the entire run: every
 * remaining record went unchecked and the only trace was a failed job. Found by a fire drill on
 * the live sandbox — a record with a malformed hash made Horizon return 400, and reconciliation
 * stopped platform-wide. A control that one bad row can silently switch off is not a control.
 */
describe('ReconciliationService — one bad row cannot disable reconciliation', () => {
  const tx = (id: string, hash: string) => ({
    id, tenantId: 't1', status: 'CONFIRMED', blockchainHash: hash, correlationId: `c-${id}`,
  });

  function build(getTransaction: jest.Mock, create = jest.fn()) {
    const prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue([tx('bad', 'BOGUS'), tx('good', 'HASH2')]) },
      reconciliationException: { findFirst: jest.fn().mockResolvedValue(null), create },
    } as never;
    return { svc: new ReconciliationService(prisma, { getTransaction } as never), create };
  }

  it('continues past a chain lookup failure and still checks later records', async () => {
    const getTransaction = jest
      .fn()
      .mockRejectedValueOnce(new Error('stellar-primary: Bad Request'))
      .mockResolvedValueOnce({ status: 'confirmed' });
    const { svc } = build(getTransaction);

    const res = await svc.run();
    expect(res.scanned).toBe(2);
    // The good record was still checked — previously the throw ended the run at the first row.
    expect(getTransaction).toHaveBeenCalledTimes(2);
  });

  it('records the failure as an exception rather than swallowing it', async () => {
    const getTransaction = jest.fn().mockRejectedValue(new Error('Bad Request'));
    const { svc, create } = build(getTransaction);

    const res = await svc.run();
    expect(res.unreconciled).toBe(2);
    expect(res.exceptions).toBe(2);
    // Being unable to verify a record is a finding: it must not sit in the ledger looking
    // reconciled just because the lookup failed.
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        detail: expect.objectContaining({ chainStatus: 'unqueryable' }),
      }),
    }));
  });

  it('reports a clean run honestly when everything corroborates', async () => {
    const { svc } = build(jest.fn().mockResolvedValue({ status: 'confirmed' }));
    const res = await svc.run();
    expect(res).toEqual({ scanned: 2, exceptions: 0, unreconciled: 0 });
  });
});
