import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { Asset, StablecoinConversion } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { assertValidAmount, isValidAmount, normalizeAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import { WalletPolicyService } from '../wallets/wallet-policy.service';
import { BalanceService } from '../wallets/balance.service';
import { MintService } from './mint.service';

const QUOTE_TTL_MS = 5 * 60 * 1000;

/**
 * Loyalty→stablecoin conversion saga (§26). Disabled by default (conversion flag OFF). Never
 * a simple balance update: it burns loyalty points, then mints stablecoin, and if the mint
 * leg fails after the burn it enters a COMPENSATING state that re-issues the points — so the
 * customer is never left short.
 */
@Injectable()
export class ConversionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
    private readonly mint: MintService,
    private readonly walletPolicy: WalletPolicyService,
    private readonly balances: BalanceService,
  ) {}

  /**
   * Refresh the wallet's balance read model from chain after an on-chain change. Best-effort: the
   * chain is authoritative and the balance reconciler catches residual drift, so this never fails
   * the saga. Without it, a conversion burn/mint leaves the cached balance stale and the reconciler
   * (correctly) flags BALANCE_DRIFT — AssetsService already refreshes on its own value paths.
   */
  private async refreshBalances(tenantId: string, walletId: string): Promise<void> {
    try {
      const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
      if (wallet) {
        await this.balances.refreshFromChain({ tenantId, walletId, stellarAccountId: wallet.stellarAccountId });
      }
    } catch {
      // swallow — cache freshness is best-effort; the reconciler is the backstop.
    }
  }

  async quote(
    auth: AuthContext,
    input: { fromAssetId: string; toAssetId: string; walletId: string; pointsAmount: string; rate?: string; spread?: string; fee?: string },
    correlationId: string,
  ): Promise<StablecoinConversion> {
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.conversion.enabled', auth.tenantId);
    assertValidAmount(input.pointsAmount);

    const rate = input.rate ?? '0.01';
    const spread = input.spread ?? '0';
    const fee = input.fee ?? '0';
    // Rate math is fractional; normalize the result to a valid 7-dp amount so float garbage
    // (>7 dp / IEEE-754 error / 0) never reaches the chain.
    const gross = Number(input.pointsAmount) * Number(rate) * (1 - Number(spread));
    const stablecoinAmount = normalizeAmount(Math.max(0, gross - Number(fee)));
    if (!isValidAmount(stablecoinAmount)) {
      throw new BadRequestException('Conversion yields a non-positive amount for these terms');
    }

    return this.prisma.stablecoinConversion.create({
      data: {
        tenantId: auth.tenantId,
        fromAssetId: input.fromAssetId,
        toAssetId: input.toAssetId,
        walletId: input.walletId,
        pointsAmount: input.pointsAmount,
        stablecoinAmount,
        rate,
        spread,
        fee,
        status: 'QUOTED',
        quoteExpiresAt: new Date(Date.now() + QUOTE_TTL_MS),
        correlationId,
      },
    });
  }

  async confirm(auth: AuthContext, id: string, now = new Date()): Promise<StablecoinConversion> {
    const c = await this.load(auth.tenantId, id);
    if (c.status !== 'QUOTED') throw new BadRequestException(`Conversion is not a live quote (status=${c.status})`);
    if (c.quoteExpiresAt.getTime() < now.getTime()) {
      return this.set(c.id, { status: 'FAILED', failureReason: 'quote expired' });
    }
    return this.set(c.id, { status: 'CONFIRMED' });
  }

  async advance(tenantId: string, id: string): Promise<StablecoinConversion> {
    const c = await this.load(tenantId, id);
    switch (c.status) {
      case 'CONFIRMED':
        return this.stepBurnPoints(c);
      case 'POINTS_BURN_PENDING':
        return this.stepConfirmBurn(c);
      case 'POINTS_BURNED':
        return this.stepMint(c);
      case 'STABLECOIN_MINT_PENDING':
        // Interrupted mid-mint — the stablecoin may or may not have been issued. Do NOT
        // auto-compensate (that could over-issue). Fail for manual review + reconciliation.
        return this.set(c.id, { status: 'FAILED', failureReason: 'mint interrupted — manual review' });
      case 'COMPENSATING':
        return this.stepCompensate(c);
      default:
        return c;
    }
  }

  async get(tenantId: string, id: string): Promise<StablecoinConversion> {
    return this.load(tenantId, id);
  }

  // --- saga steps ----------------------------------------------------------

  private async stepBurnPoints(c: StablecoinConversion): Promise<StablecoinConversion> {
    const claimed = await this.claim(c.id, 'CONFIRMED', 'POINTS_BURN_PENDING');
    if (!claimed) return this.load(c.tenantId, c.id);
    const from = await this.loadAsset(c.tenantId, c.fromAssetId);
    const wallet = await this.walletWithSecret(c.walletId);
    const res = await this.chain.burnAsset({
      correlationId: c.correlationId,
      assetCode: from.assetCode,
      issuerPublicKey: from.issuerPublicKey,
      holderPublicKey: wallet.stellarAccountId,
      holderSecretKey: wallet.secret,
      amount: c.pointsAmount,
    });
    await this.prisma.transaction.create({
      data: {
        tenantId: c.tenantId,
        type: 'ASSET_BURNED',
        status: 'PENDING_CONFIRMATION',
        blockchainHash: res.transactionHash,
        assetId: c.fromAssetId,
        amount: c.pointsAmount,
        correlationId: c.correlationId,
        sourceWalletId: c.walletId,
        createdBy: 'system:conversion',
        businessReason: 'loyalty->stablecoin conversion burn',
        submittedAt: new Date(),
      },
    });
    return this.set(c.id, { pointsBurnHash: res.transactionHash });
  }

  private async claim(id: string, from: string, to: string): Promise<boolean> {
    const res = await this.prisma.stablecoinConversion.updateMany({
      where: { id, status: from as never },
      data: { status: to as never },
    });
    return res.count === 1;
  }

  private async stepConfirmBurn(c: StablecoinConversion): Promise<StablecoinConversion> {
    if (!c.pointsBurnHash) return this.set(c.id, { status: 'FAILED', failureReason: 'missing burn hash' });
    const onChain = await this.chain.getTransaction({ transactionHash: c.pointsBurnHash });
    if (onChain.status === 'confirmed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: c.pointsBurnHash, type: 'ASSET_BURNED' },
        data: { status: 'CONFIRMED', confirmedAt: new Date(), failureReason: null, failureCode: null },
      });
      await this.refreshBalances(c.tenantId, c.walletId); // cache reflects the burned points
      return this.set(c.id, { status: 'POINTS_BURNED' });
    }
    if (onChain.status === 'failed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: c.pointsBurnHash, type: 'ASSET_BURNED' },
        data: { status: 'FAILED', failureReason: 'points burn failed', failureCode: 'CHAIN_FAILED' },
      });
      return this.set(c.id, { status: 'FAILED', failureReason: 'points burn failed' });
    }
    return c; // pending → retry
  }

  private async stepMint(c: StablecoinConversion): Promise<StablecoinConversion> {
    const claimed = await this.claim(c.id, 'POINTS_BURNED', 'STABLECOIN_MINT_PENDING');
    if (!claimed) return this.load(c.tenantId, c.id);
    const to = await this.loadAsset(c.tenantId, c.toAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: c.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (!to.issuerSecretEnc) throw new BadRequestException('Stablecoin issuer has no managed key');

    // §22/§23: conversion used to call chain.issueAsset directly, skipping every control the
    // mint saga applies — reserve sufficiency, the daily mint limit, the approval gate. Burning
    // loyalty points creates no reserve, so a conversion still has to be backed like any other
    // mint. This is the same guard stepMint uses, not a second copy of it.
    await this.mint.assertMintAllowed({
      tenantId: c.tenantId,
      assetId: c.toAssetId,
      amount: c.stablecoinAmount,
      resourceId: c.id,
      resourceType: 'stablecoin_conversion',
      correlationId: c.correlationId,
    });

    // §27: the destination must be stablecoin-enabled. Converting into a wallet that may not
    // hold stablecoin would be a side door around the wallet controls.
    await this.walletPolicy.assertAllowed({
      tenantId: c.tenantId,
      walletId: wallet.id,
      assetId: c.toAssetId,
      operation: 'RECEIVE',
      amount: c.stablecoinAmount,
    });

    try {
      const result = await this.chain.issueAsset({
        correlationId: c.correlationId,
        assetCode: to.assetCode,
        issuerPublicKey: to.issuerPublicKey,
        issuerSecretKey: this.crypto.decrypt(to.issuerSecretEnc),
        destinationPublicKey: wallet.stellarAccountId,
        amount: c.stablecoinAmount,
      });
      await this.prisma.transaction.create({
        data: {
          tenantId: c.tenantId,
          type: 'ASSET_ISSUED',
          status: 'PENDING_CONFIRMATION',
          blockchainHash: result.transactionHash,
          assetId: c.toAssetId,
          amount: c.stablecoinAmount,
          correlationId: c.correlationId,
          destinationWalletId: wallet.id,
          createdBy: 'system:conversion',
          businessReason: 'loyalty->stablecoin conversion mint',
          submittedAt: new Date(),
        },
      });

      // Record the mint so this supply is VISIBLE. ReserveService.getState sums
      // StablecoinMintRequest rows to compute outstanding supply — conversion created none, so
      // every converted token was invisible supply and the reserve ratio silently over-reported
      // its own coverage. `mintRequestId` has existed on the model for exactly this and was
      // never written.
      const mintRecord = await this.prisma.stablecoinMintRequest.create({
        data: {
          tenantId: c.tenantId,
          assetId: c.toAssetId,
          destinationWalletId: c.walletId,
          amount: c.stablecoinAmount,
          status: 'CONFIRMED',
          // The burned points are the funding event; naming the conversion keeps the trail whole.
          fundingReference: `conversion:${c.id}`,
          reserveConfirmed: true,
          requestedBy: 'system:conversion',
          blockchainHash: result.transactionHash,
          correlationId: c.correlationId,
        },
      });

      await this.refreshBalances(c.tenantId, c.walletId); // cache reflects the minted stablecoin
      return this.set(c.id, { status: 'COMPLETED', mintRequestId: mintRecord.id });
    } catch (err) {
      // Mint failed AFTER points were burned → must compensate (re-issue points).
      await this.audit.record({
        tenantId: c.tenantId,
        actor: 'system:conversion',
        action: 'conversion.mint_failed.compensating',
        resourceType: 'stablecoin_conversion',
        resourceId: c.id,
        correlationId: c.correlationId,
        metadata: { error: err instanceof Error ? err.message : 'mint error' },
      });
      return this.set(c.id, { status: 'COMPENSATING', failureReason: 'stablecoin mint failed after points burn' });
    }
  }

  private async stepCompensate(c: StablecoinConversion): Promise<StablecoinConversion> {
    // Re-issue the burned loyalty points back to the customer.
    const from = await this.loadAsset(c.tenantId, c.fromAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: c.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (!from.issuerSecretEnc) throw new BadRequestException('Loyalty issuer has no managed key');
    await this.chain.issueAsset({
      correlationId: c.correlationId,
      assetCode: from.assetCode,
      issuerPublicKey: from.issuerPublicKey,
      issuerSecretKey: this.crypto.decrypt(from.issuerSecretEnc),
      destinationPublicKey: wallet.stellarAccountId,
      amount: c.pointsAmount,
    });
    await this.refreshBalances(c.tenantId, c.walletId); // cache reflects the re-issued points
    return this.set(c.id, { status: 'COMPENSATED' });
  }

  // --- helpers -------------------------------------------------------------

  private async loadAsset(tenantId: string, assetId: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.tenantId !== tenantId) throw new NotFoundException('Asset not found');
    return asset;
  }

  private async walletWithSecret(walletId: string): Promise<{ stellarAccountId: string; secret: string }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet?.stellarSecretEnc) throw new BadRequestException('Wallet has no managed key');
    return { stellarAccountId: wallet.stellarAccountId, secret: this.crypto.decrypt(wallet.stellarSecretEnc) };
  }

  private async load(tenantId: string, id: string): Promise<StablecoinConversion> {
    const c = await this.prisma.stablecoinConversion.findUnique({ where: { id } });
    if (!c || c.tenantId !== tenantId) throw new NotFoundException('Conversion not found');
    return c;
  }

  private async set(id: string, data: Record<string, unknown>): Promise<StablecoinConversion> {
    return this.prisma.stablecoinConversion.update({ where: { id }, data });
  }
}
