import { ReserveVerificationService } from './reserve-verification.service';
import type { BankBalanceProvider } from './bank-balance.provider';

const bankSaying = (balances: Record<string, string>): BankBalanceProvider => ({
  name: 'test-bank',
  getBalance: async (accountNumber: string) =>
    balances[accountNumber]
      ? {
          accountNumber,
          accountName: 'Test',
          currency: 'KHR',
          balance: balances[accountNumber],
          asOf: new Date('2026-07-17T00:00:00Z'),
          provider: 'test-bank',
        }
      : null,
});

const prismaWith = (accounts: Array<Record<string, unknown>>) =>
  ({ reserveAccount: { findMany: async () => accounts } }) as never;

describe('ReserveVerificationService (§31 bank reserves)', () => {
  it('VERIFIES when the ledger agrees with the bank', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([{ id: 'r1', label: 'Main', bankReference: '012875798', balance: '250000' }]),
      bankSaying({ '012875798': '250000' }),
    );
    const res = (await svc.verifyAccounts('t1', 'a1'))[0]!;
    expect(res.status).toBe('VERIFIED');
    expect(res.difference).toBe('0');
  });

  // The test this whole design exists to make possible. If the mock bank were a view over
  // ReserveAccount — the obvious shortcut — the two figures could never disagree, and this
  // check would pass forever while detecting nothing.
  it('detects DRIFT when our books claim more than the bank holds', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([{ id: 'r1', label: 'Main', bankReference: '012875798', balance: '250000' }]),
      bankSaying({ '012875798': '100000' }),
    );
    const res = (await svc.verifyAccounts('t1', 'a1'))[0]!;
    expect(res.status).toBe('DRIFT');
    expect(res.difference).toBe('150000');
    expect(res.reason).toMatch(/Ledger claims 250000, bank reports 100000/);
  });

  it('reports UNVERIFIABLE — never VERIFIED — when there is no bank reference', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([{ id: 'r1', label: 'Cash', bankReference: null, balance: '999' }]),
      bankSaying({}),
    );
    const res = (await svc.verifyAccounts('t1', 'a1'))[0]!;
    expect(res.status).toBe('UNVERIFIABLE');
    expect(res.bankBalance).toBeNull();
  });

  it('treats a bank outage as unverified, not as agreement', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([{ id: 'r1', label: 'Main', bankReference: '012875798', balance: '250000' }]),
      { name: 'down', getBalance: async () => { throw new Error('timeout'); } },
    );
    const res = (await svc.verifyAccounts('t1', 'a1'))[0]!;
    expect(res.status).toBe('UNVERIFIABLE');
    expect(res.reason).toMatch(/timeout/);
  });

  it('one unreachable account does not abort the sweep', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([
        { id: 'r1', label: 'Broken', bankReference: 'nope', balance: '100' },
        { id: 'r2', label: 'Good', bankReference: '012875798', balance: '250000' },
      ]),
      bankSaying({ '012875798': '250000' }),
    );
    const res = await svc.verifyAccounts('t1', 'a1');
    expect(res).toHaveLength(2);
    expect(res[1]!.status).toBe('VERIFIED');
  });

  it('counts only corroborated money as verified — unproven contributes zero, not itself', async () => {
    const svc = new ReserveVerificationService(
      prismaWith([
        { id: 'r1', label: 'Main', bankReference: '012875798', balance: '250000' },
        { id: 'r2', label: 'Drifting', bankReference: 'other', balance: '80000' },
        { id: 'r3', label: 'No ref', bankReference: null, balance: '20000' },
      ]),
      bankSaying({ '012875798': '250000', other: '1' }),
    );
    const total = await svc.verifiedTotal('t1', 'a1');
    expect(total.claimed).toBe('350000');
    expect(total.verified).toBe('250000');
    // 100000 of the claimed reserve is not something PayChain can currently prove.
    expect(total.unverified).toBe('100000');
  });
});
