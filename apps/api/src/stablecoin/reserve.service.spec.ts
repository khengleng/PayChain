import { ReserveService } from './reserve.service';

describe('ReserveService.getState', () => {
  function build(accounts: { balance: string }[], minted: { amount: string }[], redeemed: { amount: string }[]) {
    const prisma = {
      reserveAccount: { findMany: jest.fn().mockResolvedValue(accounts) },
      stablecoinMintRequest: { findMany: jest.fn().mockResolvedValue(minted) },
      stablecoinRedemption: { findMany: jest.fn().mockResolvedValue(redeemed) },
    } as never;
    return new ReserveService(prisma, { record: jest.fn() } as never);
  }

  it('computes ratio and flags no shortfall when fully reserved (§5, §23)', async () => {
    const svc = build([{ balance: '1000' }], [{ amount: '1000' }], []);
    const s = await svc.getState('t1', 'a1', '1.0');
    expect(s.reserveBalance).toBe('1000');
    expect(s.outstandingSupply).toBe('1000');
    expect(Number(s.reserveRatio)).toBeCloseTo(1);
    expect(s.shortfall).toBe(false);
  });

  it('flags a shortfall when reserves fall below the target ratio', async () => {
    const svc = build([{ balance: '800' }], [{ amount: '1000' }], []);
    const s = await svc.getState('t1', 'a1', '1.0');
    expect(Number(s.reserveRatio)).toBeCloseTo(0.8);
    expect(s.shortfall).toBe(true);
  });

  it('reduces outstanding supply by redemptions/burns', async () => {
    const svc = build([{ balance: '1000' }], [{ amount: '1000' }], [{ amount: '400' }]);
    const s = await svc.getState('t1', 'a1', '1.0');
    expect(s.outstandingSupply).toBe('600');
    expect(s.shortfall).toBe(false); // 1000 reserve vs 600 supply
  });
});
