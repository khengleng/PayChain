import { ReconciliationService, sameAmount } from './reconciliation.service';

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

describe('sameAmount — formatting must not look like drift', () => {
  it('treats chain and DB representations of the same value as equal', () => {
    // The chain returns "1000.0000000" where we may store "1000". A string compare would report
    // drift on every balance and bury a real one in the noise.
    expect(sameAmount('1000.0000000', '1000')).toBe(true);
    expect(sameAmount('0', '0.0000000')).toBe(true);
    expect(sameAmount('1.5', '1.5000000')).toBe(true);
  });

  it('detects a genuine difference, including at the smallest unit', () => {
    expect(sameAmount('1000.0000000', '1000.0000001')).toBe(false);
    expect(sameAmount('1000', '999')).toBe(false);
  });
});

describe('ReconciliationService — balance drift (chain is authoritative)', () => {
  const wallet = { id: 'w1', tenantId: 't1', stellarAccountId: 'GA1' };

  function build(chainBalances: unknown[], dbBalances: unknown[], create = jest.fn()) {
    const prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue([]) },
      wallet: { findMany: jest.fn().mockResolvedValue([wallet]) },
      balanceReadModel: { findMany: jest.fn().mockResolvedValue(dbBalances) },
      reconciliationException: { findFirst: jest.fn().mockResolvedValue(null), create },
    } as never;
    const chain = { getBalance: jest.fn().mockResolvedValue(chainBalances) } as never;
    return { svc: new ReconciliationService(prisma, chain), create };
  }

  it('reports no drift when the read-model matches the chain', async () => {
    const { svc } = build(
      [{ assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '1000.0000000' }],
      [{ walletId: 'w1', assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '1000' }],
    );
    expect(await svc.reconcileBalances()).toEqual({ scanned: 1, drifted: 0, unreconciled: 0 });
  });

  it('DETECTS a balance we serve that the chain does not corroborate', async () => {
    const { svc, create } = build(
      [{ assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '900' }],
      [{ walletId: 'w1', assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '1000' }],
    );
    const res = await svc.reconcileBalances();
    expect(res.drifted).toBe(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        category: 'BALANCE_DRIFT',
        detail: expect.objectContaining({ recordedBalance: '1000', chainBalance: '900' }),
      }),
    }));
  });

  it('DETECTS a balance recorded for an asset the wallet does not hold on-chain', async () => {
    // Absent on-chain means zero, not "skip" — this is exactly the drift worth catching.
    const { svc } = build([], [{ walletId: 'w1', assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '50' }]);
    expect((await svc.reconcileBalances()).drifted).toBe(1);
  });

  it('does not net two issuers of the same asset code against each other', async () => {
    const { svc } = build(
      [{ assetCode: 'PTS', issuerPublicKey: 'GI1', balance: '100' }],
      [{ walletId: 'w1', assetCode: 'PTS', issuerPublicKey: 'GI2', balance: '100' }],
    );
    // Same code, different issuer = a different asset. Collapsing them would hide the drift.
    expect((await svc.reconcileBalances()).drifted).toBe(1);
  });
});

describe('ReconciliationService — orphan chain transactions (the direction never asked)', () => {
  const wallet = { id: 'w1', tenantId: 't1', stellarAccountId: 'GA1' };

  function build(history: unknown[], knownHashes: string[], create = jest.fn()) {
    const prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue(knownHashes.map((h) => ({ blockchainHash: h }))) },
      wallet: { findMany: jest.fn().mockResolvedValue([wallet]) },
      balanceReadModel: { findMany: jest.fn().mockResolvedValue([]) },
      reconciliationException: { findFirst: jest.fn().mockResolvedValue(null), create },
    } as never;
    const chain = { getTransactionHistory: jest.fn().mockResolvedValue(history) } as never;
    return { svc: new ReconciliationService(prisma, chain), create };
  }

  it('DETECTS on-chain activity PayChain has no record of — value moved outside the platform', async () => {
    const { svc, create } = build([{ transactionHash: 'UNKNOWN1', status: 'confirmed', ledger: 42 }], []);
    const res = await svc.findOrphanTransactions();
    expect(res.orphans).toBe(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        category: 'ORPHAN_BLOCKCHAIN_TRANSACTION',
        blockchainHash: 'UNKNOWN1',
      }),
    }));
    // No transactionId at all: the whole point of an orphan is that no record exists to link to.
    expect(create.mock.calls[0]![0].data).not.toHaveProperty('transactionId');
  });

  it('stays quiet when every on-chain transaction is accounted for', async () => {
    const { svc } = build([{ transactionHash: 'KNOWN1', status: 'confirmed' }], ['KNOWN1']);
    expect((await svc.findOrphanTransactions()).orphans).toBe(0);
  });

  it('does not fail the sweep when one wallet is unqueryable', async () => {
    const prisma = {
      transaction: { findMany: jest.fn().mockResolvedValue([]) },
      wallet: { findMany: jest.fn().mockResolvedValue([wallet, { ...wallet, id: 'w2' }]) },
      balanceReadModel: { findMany: jest.fn().mockResolvedValue([]) },
      reconciliationException: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
    } as never;
    const chain = {
      getTransactionHistory: jest.fn()
        .mockRejectedValueOnce(new Error('Bad Request'))
        .mockResolvedValueOnce([]),
    } as never;
    const svc = new ReconciliationService(prisma, chain);
    const res = await svc.findOrphanTransactions();
    expect(res.scanned).toBe(2);
    expect(res.unreconciled).toBe(1);
  });
});
