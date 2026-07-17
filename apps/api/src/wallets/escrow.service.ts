import { BadRequestException, Injectable } from '@nestjs/common';
import type { RedemptionStatus } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { compareAmounts, subAmounts, sumAmounts } from '../common/money';

/**
 * Redemption states where the customer's tokens are committed but not yet burned.
 *
 * From ESCROW_HELD the tokens are spoken for: fiat is about to be, or has been, paid out against
 * them. They stop being escrowed once BURN_CONFIRMED (they no longer exist) or once the
 * redemption is REJECTED/FAILED (the claim is released).
 */
const ESCROWED_STATUSES: RedemptionStatus[] = [
  'ESCROW_HELD',
  'FIAT_PAYOUT_PENDING',
  'FIAT_PAYOUT_CONFIRMED',
  'BURN_PENDING',
];

/**
 * Escrow holds on wallet balances (§25).
 *
 * `ESCROW_HELD` was a status string and nothing else: it moved no money, placed no lien and
 * touched no balance. Between escrow and burn the holder could simply transfer the tokens away —
 * and since §0.8 sequences payout BEFORE burn, that meant the fiat went out and the tokens
 * survived. A redeem-then-transfer would have taken both.
 *
 * The hold is enforced in the application rather than on-chain, and that is sufficient HERE
 * because wallets are custodial: PayChain holds the signing key, and every path that moves value
 * out of a wallet goes through WalletsService.requireSecret. There is no way to spend these
 * tokens without PayChain signing, so PayChain declining to sign IS the lock.
 *
 * That reasoning would NOT hold for a non-custodial wallet, where the holder could move funds
 * directly on-chain. If self-custody is ever introduced, this must become an on-chain hold
 * (sponsored trustline flags, or moving the tokens to a real escrow account).
 */
@Injectable()
export class EscrowService {
  constructor(private readonly prisma: PrismaService) {}

  /** Total committed to in-flight redemptions for (wallet, asset). */
  async escrowedAmount(walletId: string, assetId: string): Promise<string> {
    const rows = await this.prisma.stablecoinRedemption.findMany({
      where: { walletId, assetId, status: { in: ESCROWED_STATUSES } },
      select: { amount: true },
    });
    return sumAmounts(rows.map((r) => r.amount));
  }

  /**
   * Refuses to move `amount` out of a wallet if doing so would eat into escrowed tokens.
   *
   * Called before any debit: transfer, redeem and burn. A hold checked after the tokens have
   * gone is not a hold.
   */
  async assertSpendable(input: {
    walletId: string;
    assetId: string;
    assetCode: string;
    issuerPublicKey: string;
    amount: string;
  }): Promise<void> {
    const escrowed = await this.escrowedAmount(input.walletId, input.assetId);
    // Fast path: nothing is escrowed, so nothing to protect. Avoids a balance read on the
    // overwhelmingly common case (loyalty transfers, wallets with no redemption in flight).
    if (compareAmounts(escrowed, '0') === 0) return;

    const held = await this.prisma.balanceReadModel.findFirst({
      where: {
        walletId: input.walletId,
        assetCode: input.assetCode,
        issuerPublicKey: input.issuerPublicKey,
      },
      select: { balance: true },
    });
    const balance = held?.balance ?? '0';
    const spendable = subAmounts(balance, escrowed);

    if (compareAmounts(input.amount, spendable) > 0) {
      throw new BadRequestException(
        `Refusing: ${escrowed} of this wallet's ${balance} is escrowed against an in-flight ` +
          `redemption, leaving ${spendable} spendable — cannot move ${input.amount}.`,
      );
    }
  }
}
