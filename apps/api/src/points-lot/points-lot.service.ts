import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fromScaled, toScaled } from '../common/money';

/**
 * Draws down PointsLot.remaining when points leave a wallet by burning (spend, redeem, cross-peg
 * exchange source, loyalty→stablecoin conversion, or a direct asset burn).
 *
 * PointsLot is the per-(wallet,asset) earn ledger used for expiry (§21). It was written on issue and
 * zeroed on expiry, but NO burn path decremented it — so `remaining` drifted stale-high the moment
 * points were burned. The on-chain balance is authoritative and the expiry job already clamps to it,
 * so this never caused value loss; but the lot ledger disagreed with the chain, which any
 * "expected points from lots" reconciliation (and precise expiry) correctly flags. This makes the
 * lot ledger track the chain.
 *
 * Consumption is FIFO by expiry: the soonest-expiring lots are drawn down first (non-expiring lots
 * last), so a spend burns the points closest to expiring — the customer-favourable order.
 *
 * Best-effort by design: called AFTER the irreversible on-chain burn confirms, so a failure here
 * must never fail the flow (the chain already moved). A failed decrement leaves lots stale-high,
 * i.e. exactly today's behaviour — never worse.
 */
@Injectable()
export class PointsLotService {
  private readonly logger = new Logger(PointsLotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async consume(tenantId: string, walletId: string, assetId: string, amount: string): Promise<void> {
    try {
      let need = toScaled(amount);
      if (need <= 0n) return;

      // ACTIVE lots only, soonest-expiring first (nulls — non-expiring — last), then oldest earn.
      const lots = await this.prisma.pointsLot.findMany({
        where: { tenantId, walletId, assetId, status: 'ACTIVE' },
        orderBy: [{ expiresAt: { sort: 'asc', nulls: 'last' } }, { earnedAt: 'asc' }],
      });

      for (const lot of lots) {
        if (need <= 0n) break;
        const rem = toScaled(lot.remaining);
        if (rem <= 0n) continue;
        const take = rem < need ? rem : need;
        const nextRem = rem - take;
        await this.prisma.pointsLot.update({
          where: { id: lot.id },
          // A fully drawn-down lot is CONSUMED (distinct from EXPIRED); expiry skips non-ACTIVE lots.
          data: { remaining: fromScaled(nextRem), ...(nextRem <= 0n ? { status: 'CONSUMED' } : {}) },
        });
        need -= take;
      }

      if (need > 0n) {
        // The wallet held fewer lotted points than were burned — possible when points were issued
        // outside the lot path or lots already expired. Not an error (the chain is authoritative),
        // but worth a breadcrumb.
        this.logger.warn(
          `PointsLot consume for wallet=${walletId} asset=${assetId} left ${fromScaled(need)} of ` +
            `${amount} unattributed to any lot.`,
        );
      }
    } catch (err) {
      // Never fail the caller: the burn already happened on chain. Stale lots = today's behaviour.
      this.logger.error(
        `PointsLot consume failed (wallet=${walletId} asset=${assetId} amount=${amount}): ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Migrates lots when points are TRANSFERRED between wallets: draw down the source's ACTIVE lots
   * FIFO by expiry and create matching lots at the destination that PRESERVE each source lot's
   * expiry. Preserving expiresAt is the point — otherwise a customer could reset an expiry clock by
   * bouncing points to another wallet and back. Best-effort, same contract as consume(): called
   * after the on-chain transfer confirms, and never fails the caller.
   */
  async transfer(
    tenantId: string,
    fromWalletId: string,
    toWalletId: string,
    assetId: string,
    amount: string,
  ): Promise<void> {
    try {
      let need = toScaled(amount);
      if (need <= 0n) return;

      const lots = await this.prisma.pointsLot.findMany({
        where: { tenantId, walletId: fromWalletId, assetId, status: 'ACTIVE' },
        orderBy: [{ expiresAt: { sort: 'asc', nulls: 'last' } }, { earnedAt: 'asc' }],
      });

      for (const lot of lots) {
        if (need <= 0n) break;
        const rem = toScaled(lot.remaining);
        if (rem <= 0n) continue;
        const take = rem < need ? rem : need;
        const nextRem = rem - take;
        // Draw down the source lot...
        await this.prisma.pointsLot.update({
          where: { id: lot.id },
          data: { remaining: fromScaled(nextRem), ...(nextRem <= 0n ? { status: 'CONSUMED' } : {}) },
        });
        // ...and re-create the moved slice at the destination with the SAME expiry.
        await this.prisma.pointsLot.create({
          data: {
            tenantId,
            walletId: toWalletId,
            assetId,
            amount: fromScaled(take),
            remaining: fromScaled(take),
            expiresAt: lot.expiresAt,
          },
        });
        need -= take;
      }

      if (need > 0n) {
        this.logger.warn(
          `PointsLot transfer for ${fromWalletId}→${toWalletId} asset=${assetId} left ${fromScaled(need)} ` +
            `of ${amount} unattributed to a source lot (created no destination lot for it).`,
        );
      }
    } catch (err) {
      this.logger.error(
        `PointsLot transfer failed (${fromWalletId}→${toWalletId} asset=${assetId} amount=${amount}): ` +
          `${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
