import { ForbiddenException, Injectable } from '@nestjs/common';
import type { WalletStablecoinPolicy } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { addAmounts, compareAmounts, sumAmounts } from '../common/money';

export type StablecoinOperation = 'RECEIVE' | 'SEND' | 'REDEEM';

/**
 * Stablecoin wallet controls (§27).
 *
 * §27's emphasised line is "Loyalty wallets do not automatically become stablecoin-enabled". The
 * model declared all thirteen controls and **no code read any of them**, which inverted exactly
 * that invariant: with nothing consulting the policy, the absence of a row was indistinguishable
 * from an unrestricted one, so every loyalty wallet on the platform was stablecoin-enabled by
 * default. That is the opposite of what the spec demands.
 *
 * So this is **default-deny**: no policy row means not enabled. A wallet becomes stablecoin-
 * capable only when an operator deliberately says so. The cost is that stablecoin operations
 * fail until a policy exists — which is the intended behaviour, not a regression.
 *
 * Policy resolution prefers an asset-specific row over the wallet-wide "ALL" row, so a wallet can
 * be enabled for one stablecoin without being enabled for every future one.
 */
@Injectable()
export class WalletPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The effective policy for (wallet, asset), or null when none exists.
   * Asset-specific beats the wallet-wide default — a narrower grant must win.
   */
  async resolve(walletId: string, assetId: string): Promise<WalletStablecoinPolicy | null> {
    const rows = await this.prisma.walletStablecoinPolicy.findMany({
      where: { walletId, assetId: { in: [assetId, 'ALL'] } },
    });
    return rows.find((p) => p.assetId === assetId) ?? rows.find((p) => p.assetId === 'ALL') ?? null;
  }

  /**
   * Gate a stablecoin operation on the wallet's policy (§27).
   *
   * `amount` is the value about to move. Callers pass it so limit checks are made BEFORE the
   * money moves — a limit checked afterwards is a report, not a control.
   */
  async assertAllowed(input: {
    tenantId: string;
    walletId: string;
    assetId: string;
    operation: StablecoinOperation;
    amount: string;
  }): Promise<void> {
    const { tenantId, walletId, assetId, operation, amount } = input;
    const policy = await this.resolve(walletId, assetId);

    // THE §27 invariant. Everything below is refinement; this line is the rule.
    if (!policy) {
      throw new ForbiddenException(
        `Wallet ${walletId} is not stablecoin-enabled: no stablecoin policy exists for asset ` +
          `${assetId}. Loyalty wallets do not automatically become stablecoin-enabled (§27).`,
      );
    }
    if (policy.tenantId !== tenantId) {
      // A policy belonging to another tenant must never authorise this wallet.
      throw new ForbiddenException(`Wallet ${walletId} is not stablecoin-enabled for this tenant`);
    }

    if (policy.frozen) {
      throw new ForbiddenException(`Wallet ${walletId} is frozen for stablecoin activity`);
    }
    if (policy.sanctionsStatus !== 'CLEAR') {
      throw new ForbiddenException(
        `Wallet ${walletId} has sanctions status ${policy.sanctionsStatus} — refusing stablecoin activity`,
      );
    }
    // EDD outstanding is a stop, not a warning: the whole point of enhanced due diligence is
    // that it happens before further activity, not alongside it.
    if (policy.eddRequired) {
      throw new ForbiddenException(
        `Wallet ${walletId} requires enhanced due diligence before further stablecoin activity`,
      );
    }
    if (policy.kycLevel === 'NONE') {
      throw new ForbiddenException(
        `Wallet ${walletId} has no KYC level recorded — refusing stablecoin activity`,
      );
    }

    if (operation === 'SEND' && policy.transferRestricted) {
      throw new ForbiddenException(`Wallet ${walletId} is restricted from sending stablecoin`);
    }
    if (operation === 'REDEEM' && !policy.redemptionEligible) {
      throw new ForbiddenException(`Wallet ${walletId} is not eligible for redemption`);
    }

    if (operation === 'RECEIVE') {
      await this.assertWithinBalanceCap(policy, walletId, assetId, amount);
      await this.assertWithinDailyReceive(policy, tenantId, walletId, assetId, amount);
    }
    if (operation === 'SEND' || operation === 'REDEEM') {
      await this.assertWithinDailySend(policy, tenantId, walletId, assetId, amount);
    }
  }

  /** maxBalance: would this receipt take the holding past its cap? */
  private async assertWithinBalanceCap(
    policy: WalletStablecoinPolicy,
    walletId: string,
    assetId: string,
    amount: string,
  ): Promise<void> {
    if (!policy.maxBalance) return;
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { assetCode: true, issuerPublicKey: true },
    });
    if (!asset) return;

    const held = await this.prisma.balanceReadModel.findFirst({
      where: { walletId, assetCode: asset.assetCode, issuerPublicKey: asset.issuerPublicKey },
      select: { balance: true },
    });
    const projected = addAmounts(held?.balance ?? '0', amount);
    if (compareAmounts(projected, policy.maxBalance) > 0) {
      throw new ForbiddenException(
        `Refusing: would take wallet balance to ${projected}, above its cap of ${policy.maxBalance}`,
      );
    }
  }

  /**
   * maxDailyReceive, measured from mint requests.
   *
   * Deliberately sourced from the saga tables rather than `transaction`: the stablecoin sagas
   * write no Transaction rows (§17), so summing that table would return zero and the limit would
   * silently never bind. A limit that cannot fire is worse than no limit — it reads as a control.
   */
  private async assertWithinDailyReceive(
    policy: WalletStablecoinPolicy,
    tenantId: string,
    walletId: string,
    assetId: string,
    amount: string,
  ): Promise<void> {
    if (!policy.maxDailyReceive) return;
    const rows = await this.prisma.stablecoinMintRequest.findMany({
      where: {
        tenantId,
        assetId,
        destinationWalletId: walletId,
        status: { notIn: ['REJECTED', 'FAILED'] },
        createdAt: { gte: startOfToday() },
      },
      select: { amount: true },
    });
    const projected = addAmounts(sumAmounts(rows.map((r) => r.amount)), amount);
    if (compareAmounts(projected, policy.maxDailyReceive) > 0) {
      throw new ForbiddenException(
        `Refusing: would receive ${projected} today, above the daily receive limit of ${policy.maxDailyReceive}`,
      );
    }
  }

  /** maxDailySend, measured from redemptions for the same reason as above. */
  private async assertWithinDailySend(
    policy: WalletStablecoinPolicy,
    tenantId: string,
    walletId: string,
    assetId: string,
    amount: string,
  ): Promise<void> {
    if (!policy.maxDailySend) return;
    const rows = await this.prisma.stablecoinRedemption.findMany({
      where: {
        tenantId,
        assetId,
        walletId,
        status: { notIn: ['REJECTED', 'FAILED'] },
        createdAt: { gte: startOfToday() },
      },
      select: { amount: true },
    });
    const projected = addAmounts(sumAmounts(rows.map((r) => r.amount)), amount);
    if (compareAmounts(projected, policy.maxDailySend) > 0) {
      throw new ForbiddenException(
        `Refusing: would send ${projected} today, above the daily send limit of ${policy.maxDailySend}`,
      );
    }
  }
}

/**
 * Start of the current UTC day. UTC rather than local time so a limit means the same thing
 * regardless of where the process runs — a limit that shifts with a server's timezone is a limit
 * that can be evaded by a deploy.
 */
function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
