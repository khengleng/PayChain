import { BadRequestException } from '@nestjs/common';
import { EscrowService } from './escrow.service';

/**
 * §25. ESCROW_HELD was a status string: it moved no money, placed no lien, touched no balance.
 * Between escrow and burn the holder could transfer the tokens away — and because §0.8 sequences
 * payout BEFORE burn, a redeem-then-transfer would have taken the fiat AND kept the tokens.
 */
function build(opts: { redemptions?: { amount: string }[]; balance?: string } = {}) {
  const where: Record<string, any>[] = [];
  const prisma = {
    stablecoinRedemption: {
      findMany: async (args: { where: Record<string, any> }) => {
        where.push(args.where);
        return opts.redemptions ?? [];
      },
    },
    balanceReadModel: {
      findFirst: async () => (opts.balance ? { balance: opts.balance } : null),
    },
  } as never;
  return { svc: new EscrowService(prisma), where };
}

const spend = (amount: string) => ({
  walletId: 'w1', assetId: 'a1', assetCode: 'DUSD', issuerPublicKey: 'GI', amount,
});

describe('EscrowService — escrowed tokens are not spendable (§25)', () => {
  it('THE DOUBLE-SPEND: refuses to transfer tokens committed to an in-flight redemption', async () => {
    // 100 held, 60 escrowed against a redemption whose fiat may already have been paid out.
    const { svc } = build({ redemptions: [{ amount: '60' }], balance: '100' });
    await expect(svc.assertSpendable(spend('50'))).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.assertSpendable(spend('50'))).rejects.toThrow(/40 spendable/);
  });

  it('ALLOWS spending up to the unescrowed remainder', async () => {
    const { svc } = build({ redemptions: [{ amount: '60' }], balance: '100' });
    await expect(svc.assertSpendable(spend('40'))).resolves.toBeUndefined(); // exactly spendable
  });

  it('sums multiple in-flight redemptions', async () => {
    const { svc } = build({ redemptions: [{ amount: '30' }, { amount: '30' }], balance: '100' });
    await expect(svc.assertSpendable(spend('45'))).rejects.toThrow(/40 spendable/);
  });

  it('does not touch the balance when nothing is escrowed — the common path stays cheap', async () => {
    const { svc } = build({ redemptions: [] });
    // No balance configured: if it read one, this would throw on the null.
    await expect(svc.assertSpendable(spend('999999'))).resolves.toBeUndefined();
  });

  it('only counts redemptions whose tokens still exist and are committed', async () => {
    const { svc, where } = build({ redemptions: [], balance: '100' });
    await svc.escrowedAmount('w1', 'a1');
    // BURN_CONFIRMED/COMPLETED: the tokens are gone. REJECTED/FAILED: the claim is released.
    // Counting either would strand a customer's balance behind a redemption that ended.
    expect(where[0]!.status).toEqual({
      in: ['ESCROW_HELD', 'FIAT_PAYOUT_PENDING', 'FIAT_PAYOUT_CONFIRMED', 'BURN_PENDING'],
    });
  });

  it('is fixed-point at the boundary', async () => {
    const { svc } = build({ redemptions: [{ amount: '60.0000001' }], balance: '100' });
    await expect(svc.assertSpendable(spend('39.9999999'))).resolves.toBeUndefined();
    await expect(svc.assertSpendable(spend('40'))).rejects.toThrow(/escrowed/);
  });

  it('treats an absent balance as zero rather than unlimited', async () => {
    const { svc } = build({ redemptions: [{ amount: '10' }] });
    await expect(svc.assertSpendable(spend('1'))).rejects.toThrow(/escrowed/);
  });
});
