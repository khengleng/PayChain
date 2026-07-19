import { HttpBankBalanceProvider } from './bank-balance.provider';

const res = (status: number, body?: unknown) => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => body,
});

describe('HttpBankBalanceProvider (live Bakong client)', () => {
  it('normalizes a 200 response and sends the bearer credential to the right URL', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      res(200, {
        accountNumber: 'ACC1',
        accountName: 'Reserve',
        currency: 'USD',
        balance: '1000.50',
        asOf: '2026-01-01T00:00:00.000Z',
      }),
    );
    const p = new HttpBankBalanceProvider('https://bakong.test', 'KEY', fetchImpl as never);
    const b = await p.getBalance('ACC 1'); // note the space — must be URL-encoded

    expect(fetchImpl).toHaveBeenCalledWith('https://bakong.test/accounts/ACC%201/balance', {
      headers: { authorization: 'Bearer KEY' },
    });
    expect(b).toMatchObject({ accountNumber: 'ACC1', balance: '1000.50', currency: 'USD', provider: 'bakong' });
    expect(b?.asOf).toBeInstanceOf(Date);
  });

  it('returns null on 404 (account not found)', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(404));
    expect(await new HttpBankBalanceProvider('u', 'k', fetchImpl as never).getBalance('x')).toBeNull();
  });

  it('THROWS on a non-ok response — a failed lookup is never reported as a balance or a zero', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(res(500));
    await expect(new HttpBankBalanceProvider('u', 'k', fetchImpl as never).getBalance('x')).rejects.toThrow(/500/);
  });
});
