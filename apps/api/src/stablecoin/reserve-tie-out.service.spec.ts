import { ReserveTieOutService } from './reserve-tie-out.service';

interface State {
  backingLiability: string;
  targetRatio: string;
  outstandingSupply: string;
  unitValue: string;
}

const stateOf = (over: Partial<State> = {}): State => ({
  backingLiability: '1000',
  targetRatio: '1.0',
  outstandingSupply: '1000',
  unitValue: '1',
  ...over,
});

function build(opts: {
  ledger: string[];
  trustee: { reserveBalance: string; takenAt: Date } | null;
  state?: State;
}) {
  const prisma = {
    reserveAccount: { findMany: async () => opts.ledger.map((balance) => ({ balance })) },
    reserveSnapshot: { findFirst: async () => opts.trustee },
  };
  const reserve = { getStateForAsset: async () => opts.state ?? stateOf() };
  return new ReserveTieOutService(prisma as never, reserve as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never);
}

describe('ReserveTieOutService.tieOut (3-way reserve reconciliation)', () => {
  it('RECONCILED when ledger and trustee both cover the liability and agree', async () => {
    const t = await build({ ledger: ['1000'], trustee: { reserveBalance: '1000', takenAt: new Date() } }).tieOut('t', 'a');
    expect(t.status).toBe('RECONCILED');
    expect(t.discrepancies).toEqual([]);
    expect(t.ledgerCoversLiability).toBe(true);
    expect(t.trusteeCoversLiability).toBe(true);
    expect(t.ledgerMatchesTrustee).toBe(true);
  });

  it('SHORTFALL when the internal ledger does not cover the liability', async () => {
    const t = await build({ ledger: ['999'], trustee: { reserveBalance: '1000', takenAt: new Date() } }).tieOut('t', 'a');
    expect(t.status).toBe('SHORTFALL');
    expect(t.discrepancies).toContain('LEDGER_SHORTFALL');
    expect(t.ledgerCoversLiability).toBe(false);
  });

  it('UNATTESTED when there is no fresh trustee attestation', async () => {
    const t = await build({ ledger: ['1000'], trustee: null }).tieOut('t', 'a');
    expect(t.status).toBe('UNATTESTED');
    expect(t.discrepancies).toEqual(['NO_TRUSTEE_ATTESTATION']);
    expect(t.trusteeAttestedFiat).toBeNull();
  });

  it('MISMATCH when ledger and trustee both cover but disagree on the figure', async () => {
    // Our books say 1200, the trustee attests 1000; both cover the 1000 liability but they differ.
    const t = await build({ ledger: ['1200'], trustee: { reserveBalance: '1000', takenAt: new Date() } }).tieOut('t', 'a');
    expect(t.status).toBe('MISMATCH');
    expect(t.discrepancies).toContain('LEDGER_TRUSTEE_MISMATCH');
    expect(t.ledgerMatchesTrustee).toBe(false);
  });

  it('works in the peg currency (KHR coin: 1000 coins × 100 KHR need 100000 KHR)', async () => {
    const state = stateOf({ backingLiability: '100000', outstandingSupply: '1000', unitValue: '100' });
    const ok = await build({ ledger: ['100000'], trustee: { reserveBalance: '100000', takenAt: new Date() }, state }).tieOut('t', 'a');
    expect(ok.status).toBe('RECONCILED');
    const short = await build({ ledger: ['99999'], trustee: { reserveBalance: '100000', takenAt: new Date() }, state }).tieOut('t', 'a');
    expect(short.discrepancies).toContain('LEDGER_SHORTFALL');
  });

  it('sums multiple reserve accounts for the ledger leg', async () => {
    const t = await build({ ledger: ['600', '400'], trustee: { reserveBalance: '1000', takenAt: new Date() } }).tieOut('t', 'a');
    expect(t.ledgerReserve).toBe('1000');
    expect(t.status).toBe('RECONCILED');
  });

  it('zero supply reconciles trivially (nothing to back) when attested', async () => {
    const state = stateOf({ backingLiability: '0', outstandingSupply: '0' });
    const t = await build({ ledger: ['0'], trustee: { reserveBalance: '0', takenAt: new Date() }, state }).tieOut('t', 'a');
    expect(t.status).toBe('RECONCILED');
    expect(t.ledgerRatio).toBe('N/A');
  });
});

interface Exc { id: string; category: string; status: string; detail: { assetId?: string } }

function recordingSvc(opts: {
  ledger: string[];
  trustee: { reserveBalance: string; takenAt: Date } | null;
  state?: State;
  existing?: Exc[];
}) {
  const exceptions: Exc[] = (opts.existing ?? []).map((e) => ({ ...e }));
  const created: Record<string, unknown>[] = [];
  const updatedMany: Array<{ ids: string[]; data: Record<string, unknown> }> = [];
  let seq = 0;
  const prisma = {
    reserveAccount: { findMany: async () => opts.ledger.map((balance) => ({ balance })) },
    reserveSnapshot: { findFirst: async () => opts.trustee },
    reconciliationException: {
      findMany: async ({ where }: { where: { category: { in: string[] } } }) =>
        exceptions.filter((e) => e.status === 'OPEN' && where.category.in.includes(e.category)),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        seq += 1;
        const row = { id: `exc${seq}`, status: 'OPEN', ...data } as unknown as Exc;
        created.push(data);
        exceptions.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const e = exceptions.find((x) => x.id === where.id)!;
        Object.assign(e, data);
        return e;
      },
      updateMany: async ({ where, data }: { where: { id: { in: string[] } }; data: Record<string, unknown> }) => {
        for (const id of where.id.in) {
          const e = exceptions.find((x) => x.id === id);
          if (e) Object.assign(e, data);
        }
        updatedMany.push({ ids: where.id.in, data });
        return { count: where.id.in.length };
      },
    },
  };
  const reserve = { getStateForAsset: async () => opts.state ?? stateOf() };
  return {
    svc: new ReserveTieOutService(prisma as never, reserve as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never),
    exceptions,
    created,
    updatedMany,
  };
}

describe('ReserveTieOutService.checkAndRecord (records + alerts)', () => {
  it('opens a RESERVE_SHORTFALL exception on a shortfall', async () => {
    const { svc, created } = recordingSvc({ ledger: ['999'], trustee: { reserveBalance: '1000', takenAt: new Date() } });
    const r = await svc.checkAndRecord('t', 'a');
    expect(r.status).toBe('SHORTFALL');
    expect(r.exceptionId).toBeTruthy();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ category: 'RESERVE_SHORTFALL', tenantId: 't' });
    expect((created[0] as { detail: { assetId: string } }).detail.assetId).toBe('a');
  });

  it('maps a ledger/trustee mismatch to SUPPLY_MISMATCH and an unattested coin to STALE_RESERVE_DATA', async () => {
    const mismatch = recordingSvc({ ledger: ['1200'], trustee: { reserveBalance: '1000', takenAt: new Date() } });
    expect((await mismatch.svc.checkAndRecord('t', 'a')).status).toBe('MISMATCH');
    expect(mismatch.created[0]).toMatchObject({ category: 'SUPPLY_MISMATCH' });

    const unattested = recordingSvc({ ledger: ['1000'], trustee: null });
    expect((await unattested.svc.checkAndRecord('t', 'a')).status).toBe('UNATTESTED');
    expect(unattested.created[0]).toMatchObject({ category: 'STALE_RESERVE_DATA' });
  });

  it('RECONCILED auto-closes an existing open tie-out exception for the coin', async () => {
    const { svc, updatedMany, created } = recordingSvc({
      ledger: ['1000'],
      trustee: { reserveBalance: '1000', takenAt: new Date() },
      existing: [{ id: 'exc1', category: 'RESERVE_SHORTFALL', status: 'OPEN', detail: { assetId: 'a' } }],
    });
    const r = await svc.checkAndRecord('t', 'a');
    expect(r.status).toBe('RECONCILED');
    expect(r.exceptionId).toBeNull();
    expect(created).toHaveLength(0);
    expect(updatedMany[0]).toMatchObject({ ids: ['exc1'], data: { status: 'RESOLVED' } });
  });

  it('refreshes the SAME open exception instead of stacking duplicates', async () => {
    const { svc, created, exceptions } = recordingSvc({
      ledger: ['999'],
      trustee: { reserveBalance: '1000', takenAt: new Date() },
      existing: [{ id: 'exc1', category: 'RESERVE_SHORTFALL', status: 'OPEN', detail: { assetId: 'a' } }],
    });
    const r = await svc.checkAndRecord('t', 'a');
    expect(r.exceptionId).toBe('exc1'); // reused, not a new row
    expect(created).toHaveLength(0);
    expect(exceptions.filter((e) => e.status === 'OPEN')).toHaveLength(1);
  });

  it('does not touch another coin\'s open exception', async () => {
    const { svc, updatedMany, created } = recordingSvc({
      ledger: ['1000'],
      trustee: { reserveBalance: '1000', takenAt: new Date() },
      existing: [{ id: 'excOther', category: 'RESERVE_SHORTFALL', status: 'OPEN', detail: { assetId: 'OTHER-COIN' } }],
    });
    await svc.checkAndRecord('t', 'a'); // reconciled for coin 'a'
    expect(created).toHaveLength(0);
    expect(updatedMany).toHaveLength(0); // the other coin's exception is left alone
  });
});
