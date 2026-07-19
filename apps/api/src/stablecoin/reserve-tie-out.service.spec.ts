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
