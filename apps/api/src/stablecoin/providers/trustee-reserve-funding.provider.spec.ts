import { TrusteeReserveFundingProvider } from './trustee-reserve-funding.provider';

function build(flagOn: boolean, deposit: { amount: string } | null) {
  const prisma = { trusteeDeposit: { findFirst: jest.fn().mockResolvedValue(deposit) } } as never;
  const flags = { isEnabled: jest.fn().mockResolvedValue(flagOn) } as never;
  return new TrusteeReserveFundingProvider(prisma, flags);
}
const input = { tenantId: 't1', reference: 'DEP-1', expectedAmount: '100' };

describe('TrusteeReserveFundingProvider', () => {
  it('flag OFF: falls back to the FUND- mock (unchanged behaviour)', async () => {
    expect(await build(false, null).confirmFunding({ ...input, reference: 'FUND-1' })).toEqual({ confirmed: true, amount: '100' });
    expect(await build(false, null).confirmFunding({ ...input, reference: 'DEP-1' })).toEqual({ confirmed: false });
  });

  it('flag ON: confirms against a CLEARED deposit that covers the amount', async () => {
    expect(await build(true, { amount: '100' }).confirmFunding(input)).toEqual({ confirmed: true, amount: '100' });
    expect(await build(true, { amount: '150' }).confirmFunding(input)).toEqual({ confirmed: true, amount: '150' });
  });

  it('flag ON: refuses when no cleared deposit or the amount is short', async () => {
    expect(await build(true, null).confirmFunding(input)).toEqual({ confirmed: false });
    expect(await build(true, { amount: '99' }).confirmFunding(input)).toEqual({ confirmed: false });
  });
});
