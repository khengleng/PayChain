import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { Asset, StablecoinConfig, StablecoinExchange } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { assertValidAmount, isValidAmount, normalizeAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import { assertWalletCanTransact } from '../wallets/wallet-status';
import { WalletPolicyService } from '../wallets/wallet-policy.service';
import { EscrowService } from '../wallets/escrow.service';
import { BalanceService } from '../wallets/balance.service';
import { PointsLotService } from '../points-lot/points-lot.service';
import { MintService } from './mint.service';

const QUOTE_TTL_MS = 5 * 60 * 1000;

/**
 * Cross-peg exchange saga. Disabled by default (stablecoin.exchange flag OFF).
 *
 * A same-holder swap of one reserve-backed coin for another: burn `fromAmount` of the source coin
 * from the wallet, mint `toAmount` of the destination coin to the SAME wallet. Both coins are
 * merchant stablecoins with their own peg currency and unit value, so `toAmount` is computed at
 * quote time from each coin's `unitValue` and a caller-supplied `fxRate` (source currency →
 * destination currency): `toAmount = fromAmount × unitValue_from × fxRate × (1 − spread) /
 * unitValue_to − fee`. A same-currency swap passes fxRate "1" (pure unit-value rebasing).
 *
 * Two things make this different from ConversionService (loyalty→stablecoin), and both are
 * solvency-critical:
 *  1. The SOURCE is reserve-backed. Burning it must reduce the source coin's tracked supply —
 *     ReserveService.getState subtracts confirmed exchanges by fromAssetId, so the source coin's
 *     reserve ratio does not over-report coverage after a swap.
 *  2. The destination mint is gated by the destination coin's OWN reserve via MintService
 *     .assertMintAllowed — a swap cannot mint USD-backed coins without USD reserve, no matter how
 *     much KHR coin is burned. No reserve is moved across currencies; the freed source reserve is
 *     rebalanced separately through the existing maker-checker reserve DEBIT.
 *
 * If the mint leg fails after the source is burned, the saga enters COMPENSATING and re-issues the
 * source coin so the holder is never left short.
 */
@Injectable()
export class ExchangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
    private readonly mint: MintService,
    private readonly walletPolicy: WalletPolicyService,
    private readonly escrow: EscrowService,
    private readonly balances: BalanceService,
    private readonly pointsLots: PointsLotService,
  ) {}

  /**
   * Refresh the wallet's balance read model from chain after an on-chain change. Best-effort: the
   * chain is authoritative and the reconciler catches residual drift, so this never fails the saga.
   * The swap's source and destination are the same wallet, so one refresh covers both legs.
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
    input: {
      fromAssetId: string;
      toAssetId: string;
      walletId: string;
      fromAmount: string;
      fxRate?: string;
      spread?: string;
      fee?: string;
    },
    correlationId: string,
  ): Promise<StablecoinExchange> {
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.exchange.enabled', auth.tenantId);
    assertValidAmount(input.fromAmount);
    if (input.fromAssetId === input.toAssetId) {
      throw new BadRequestException('Exchange requires two distinct coins');
    }

    const { config: fromConfig } = await this.loadActive(auth.tenantId, input.fromAssetId);
    const { config: toConfig } = await this.loadActive(auth.tenantId, input.toAssetId);

    const fxRate = input.fxRate ?? '1';
    const spread = input.spread ?? '0';
    const fee = input.fee ?? '0';
    // Rate math is fractional (a division by unitValue_to), so — like ConversionService.quote — it
    // runs in Number and is then forced back to a valid 7-dp amount by normalizeAmount, so float
    // garbage never reaches the chain. The reserve gate on the mint leg, not this figure, is the
    // solvency backstop; a mis-supplied rate mis-prices the swap but cannot over-issue the dest coin.
    const gross =
      (Number(input.fromAmount) * Number(fromConfig.unitValue) * Number(fxRate) * (1 - Number(spread))) /
      Number(toConfig.unitValue);
    const toAmount = normalizeAmount(Math.max(0, gross - Number(fee)));
    if (!isValidAmount(toAmount)) {
      throw new BadRequestException('Exchange yields a non-positive amount for these terms');
    }

    const created = await this.prisma.stablecoinExchange.create({
      data: {
        tenantId: auth.tenantId,
        fromAssetId: input.fromAssetId,
        toAssetId: input.toAssetId,
        walletId: input.walletId,
        fromAmount: input.fromAmount,
        toAmount,
        fxRate,
        spread,
        fee,
        status: 'QUOTED',
        quoteExpiresAt: new Date(Date.now() + QUOTE_TTL_MS),
        correlationId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.exchange.quote',
      resourceType: 'stablecoin_exchange',
      resourceId: created.id,
      correlationId,
      metadata: { fromAssetId: input.fromAssetId, toAssetId: input.toAssetId, fromAmount: input.fromAmount, toAmount },
    });
    return created;
  }

  async confirm(auth: AuthContext, id: string, now = new Date()): Promise<StablecoinExchange> {
    const e = await this.load(auth.tenantId, id);
    if (e.status !== 'QUOTED') throw new BadRequestException(`Exchange is not a live quote (status=${e.status})`);
    if (e.quoteExpiresAt.getTime() < now.getTime()) {
      return this.set(e.id, { status: 'FAILED', failureReason: 'quote expired' });
    }

    // The holder must actually be able to give up the source coins: transactable wallet, and enough
    // NON-escrowed balance (assertSpendable checks the lien when anything is already escrowed). This
    // runs BEFORE we commit, so a swap can't be confirmed against tokens already committed elsewhere.
    const { asset } = await this.loadActive(auth.tenantId, e.fromAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: e.walletId } });
    if (!wallet || wallet.tenantId !== auth.tenantId) throw new NotFoundException('Exchange wallet not found');
    assertWalletCanTransact(wallet);
    await this.escrow.assertSpendable({
      walletId: e.walletId,
      assetId: e.fromAssetId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      amount: e.fromAmount,
    });

    return this.set(e.id, { status: 'CONFIRMED' });
  }

  async advance(tenantId: string, id: string): Promise<StablecoinExchange> {
    const e = await this.load(tenantId, id);
    switch (e.status) {
      case 'CONFIRMED':
        return this.stepBurnSource(e);
      case 'SOURCE_BURN_PENDING':
        return this.stepConfirmBurn(e);
      case 'SOURCE_BURNED':
        return this.stepMint(e);
      case 'DEST_MINT_PENDING':
        // Interrupted mid-mint — the destination may or may not have issued. Do NOT auto-compensate
        // (that could re-issue the source AND leave the dest minted). Fail for manual reconciliation.
        return this.set(e.id, { status: 'FAILED', failureReason: 'mint interrupted — manual review' });
      case 'COMPENSATING':
        return this.stepCompensate(e);
      default:
        return e; // QUOTED waits for confirm; terminal states are no-ops
    }
  }

  async get(tenantId: string, id: string): Promise<StablecoinExchange> {
    return this.load(tenantId, id);
  }

  // --- saga steps ----------------------------------------------------------

  private async stepBurnSource(e: StablecoinExchange): Promise<StablecoinExchange> {
    // Concurrency guard: atomically claim CONFIRMED → SOURCE_BURN_PENDING so only one caller burns.
    const claimed = await this.claim(e.id, 'CONFIRMED', 'SOURCE_BURN_PENDING');
    if (!claimed) return this.load(e.tenantId, e.id);

    const from = await this.loadAsset(e.tenantId, e.fromAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: e.walletId } });
    if (!wallet || wallet.tenantId !== e.tenantId) throw new NotFoundException('Exchange wallet not found');
    assertWalletCanTransact(wallet);
    if (!wallet.stellarSecretEnc) throw new BadRequestException('Exchange wallet has no managed key');

    const res = await this.chain.burnAsset({
      correlationId: e.correlationId,
      assetCode: from.assetCode,
      issuerPublicKey: from.issuerPublicKey,
      holderPublicKey: wallet.stellarAccountId,
      holderSecretKey: this.crypto.decrypt(wallet.stellarSecretEnc),
      amount: e.fromAmount,
    });
    await this.prisma.transaction.create({
      data: {
        tenantId: e.tenantId,
        type: 'ASSET_BURNED',
        status: 'PENDING_CONFIRMATION',
        blockchainHash: res.transactionHash,
        assetId: e.fromAssetId,
        amount: e.fromAmount,
        correlationId: e.correlationId,
        sourceWalletId: wallet.id,
        createdBy: 'system:exchange',
        businessReason: 'cross-peg exchange source burn',
        submittedAt: new Date(),
      },
    });
    return this.set(e.id, { sourceBurnHash: res.transactionHash });
  }

  private async claim(id: string, from: string, to: string): Promise<boolean> {
    const res = await this.prisma.stablecoinExchange.updateMany({
      where: { id, status: from as never },
      data: { status: to as never },
    });
    return res.count === 1;
  }

  private async stepConfirmBurn(e: StablecoinExchange): Promise<StablecoinExchange> {
    if (!e.sourceBurnHash) return this.set(e.id, { status: 'FAILED', failureReason: 'missing burn hash' });
    const onChain = await this.chain.getTransaction({ transactionHash: e.sourceBurnHash });
    if (onChain.status === 'confirmed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: e.sourceBurnHash, type: 'ASSET_BURNED' },
        data: { status: 'CONFIRMED', confirmedAt: new Date(), failureReason: null, failureCode: null },
      });
      await this.refreshBalances(e.tenantId, e.walletId); // cache reflects the burned source
      await this.pointsLots.consume(e.tenantId, e.walletId, e.fromAssetId, e.fromAmount); // draw down source lots
      return this.set(e.id, { status: 'SOURCE_BURNED' }); // source supply now counted as reduced
    }
    if (onChain.status === 'failed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: e.sourceBurnHash, type: 'ASSET_BURNED' },
        data: { status: 'FAILED', failureReason: 'source burn failed', failureCode: 'CHAIN_FAILED' },
      });
      return this.set(e.id, { status: 'FAILED', failureReason: 'source burn failed' });
    }
    return e; // pending → retry
  }

  private async stepMint(e: StablecoinExchange): Promise<StablecoinExchange> {
    const claimed = await this.claim(e.id, 'SOURCE_BURNED', 'DEST_MINT_PENDING');
    if (!claimed) return this.load(e.tenantId, e.id);

    const to = await this.loadAsset(e.tenantId, e.toAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: e.walletId } });
    if (!wallet) throw new NotFoundException('Exchange wallet not found');
    if (!to.issuerSecretEnc) throw new BadRequestException('Destination issuer has no managed key');

    // PRE-BROADCAST leg: everything up to and including issueAsset. A failure here means the
    // destination was NOT minted (or the broadcast failed), so the source burn must be undone —
    // compensate. §22/§23: reuse the one mint gate; §27: the wallet must be RECEIVE-eligible. The
    // breach/policy failures live here on purpose so an unmintable destination cleanly aborts the
    // swap (re-issue source) rather than stranding the holder's already-burned coins.
    let result: { transactionHash: string };
    try {
      await this.mint.assertMintAllowed({
        tenantId: e.tenantId,
        assetId: e.toAssetId,
        amount: e.toAmount,
        resourceId: e.id,
        resourceType: 'stablecoin_exchange',
        correlationId: e.correlationId,
      });
      await this.walletPolicy.assertAllowed({
        tenantId: e.tenantId,
        walletId: wallet.id,
        assetId: e.toAssetId,
        operation: 'RECEIVE',
        amount: e.toAmount,
      });
      result = await this.chain.issueAsset({
        correlationId: e.correlationId,
        assetCode: to.assetCode,
        issuerPublicKey: to.issuerPublicKey,
        issuerSecretKey: this.crypto.decrypt(to.issuerSecretEnc),
        destinationPublicKey: wallet.stellarAccountId,
        amount: e.toAmount,
      });
    } catch (err) {
      // Destination not minted → compensate (re-issue the source coin).
      await this.audit.record({
        tenantId: e.tenantId,
        actor: 'system:exchange',
        action: 'exchange.mint_failed.compensating',
        resourceType: 'stablecoin_exchange',
        resourceId: e.id,
        correlationId: e.correlationId,
        metadata: { error: err instanceof Error ? err.message : 'mint error' },
      });
      return this.set(e.id, { status: 'COMPENSATING', failureReason: 'destination mint failed after source burn' });
    }

    // POST-BROADCAST leg: the destination IS minted on-chain. From here we must NEVER compensate —
    // re-issuing the source now would leave the holder with BOTH coins (double value) and leave the
    // just-minted destination unbacked. Record the mint FIRST (the solvency-critical row that makes
    // the new supply visible to getState — same fix ConversionService.stepMint makes), then the
    // audit Transaction, then COMPLETED. If a write here throws, the row stays DEST_MINT_PENDING and
    // advance() routes it to FAILED (manual reconciliation) — the mint landed and must be recorded,
    // not doubled. This is NOT inside the compensating try, deliberately.
    const mintRecord = await this.prisma.stablecoinMintRequest.create({
      data: {
        tenantId: e.tenantId,
        assetId: e.toAssetId,
        destinationWalletId: e.walletId,
        amount: e.toAmount,
        status: 'CONFIRMED',
        fundingReference: `exchange:${e.id}`,
        reserveConfirmed: true,
        requestedBy: 'system:exchange',
        blockchainHash: result.transactionHash,
        correlationId: e.correlationId,
      },
    });
    await this.prisma.transaction.create({
      data: {
        tenantId: e.tenantId,
        type: 'ASSET_ISSUED',
        status: 'PENDING_CONFIRMATION',
        blockchainHash: result.transactionHash,
        assetId: e.toAssetId,
        amount: e.toAmount,
        correlationId: e.correlationId,
        destinationWalletId: wallet.id,
        createdBy: 'system:exchange',
        businessReason: 'cross-peg exchange destination mint',
        submittedAt: new Date(),
      },
    });
    await this.refreshBalances(e.tenantId, e.walletId); // cache reflects the newly minted destination
    return this.set(e.id, { status: 'COMPLETED', mintRequestId: mintRecord.id });
  }

  private async stepCompensate(e: StablecoinExchange): Promise<StablecoinExchange> {
    // Concurrency guard: the re-issue is an on-chain broadcast and must happen AT MOST ONCE, like
    // every other broadcast in this saga. Atomically claim COMPENSATING → COMPENSATED so only one
    // racing advance() re-issues; the loser sees 0 rows and returns without a second re-issue (which
    // would put unbacked source coins into circulation). If the broadcast then fails we revert to
    // COMPENSATING so a later advance can retry — never leave a COMPENSATED row whose coins were
    // never restored.
    const claimed = await this.claim(e.id, 'COMPENSATING', 'COMPENSATED');
    if (!claimed) return this.load(e.tenantId, e.id);

    // Re-issue the burned source coins back to the holder. Unconditional (no reserve gate): the
    // holder's coins were already burned and must be restored — restoring prior supply that was
    // backed a moment ago cannot itself breach. getState stops subtracting once COMPENSATED, so the
    // restored coins are counted as supply again.
    const from = await this.loadAsset(e.tenantId, e.fromAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: e.walletId } });
    if (!wallet) throw new NotFoundException('Exchange wallet not found');
    if (!from.issuerSecretEnc) throw new BadRequestException('Source issuer has no managed key');
    try {
      await this.chain.issueAsset({
        correlationId: e.correlationId,
        assetCode: from.assetCode,
        issuerPublicKey: from.issuerPublicKey,
        issuerSecretKey: this.crypto.decrypt(from.issuerSecretEnc),
        destinationPublicKey: wallet.stellarAccountId,
        amount: e.fromAmount,
      });
    } catch (err) {
      // Broadcast failed — revert so a retry can re-attempt (the claim is released back to
      // COMPENSATING). Without this the row would sit at COMPENSATED with the source never restored.
      await this.set(e.id, { status: 'COMPENSATING', failureReason: 'source re-issue failed — will retry' });
      throw err;
    }
    await this.refreshBalances(e.tenantId, e.walletId); // cache reflects the restored source
    return this.load(e.tenantId, e.id);
  }

  // --- helpers -------------------------------------------------------------

  private async loadActive(tenantId: string, assetId: string): Promise<{ asset: Asset; config: StablecoinConfig }> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId }, include: { stablecoinConfig: true } });
    if (!asset || asset.tenantId !== tenantId || !asset.stablecoinConfig) throw new NotFoundException('Stablecoin not found');
    if (asset.stablecoinConfig.lifecycleState !== 'ACTIVE') {
      throw new BadRequestException(`Stablecoin is not ACTIVE (state=${asset.stablecoinConfig.lifecycleState})`);
    }
    return { asset, config: asset.stablecoinConfig };
  }

  private async loadAsset(tenantId: string, assetId: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.tenantId !== tenantId) throw new NotFoundException('Asset not found');
    return asset;
  }

  private async load(tenantId: string, id: string): Promise<StablecoinExchange> {
    const e = await this.prisma.stablecoinExchange.findUnique({ where: { id } });
    if (!e || e.tenantId !== tenantId) throw new NotFoundException('Exchange not found');
    return e;
  }

  private async set(id: string, data: Record<string, unknown>): Promise<StablecoinExchange> {
    return this.prisma.stablecoinExchange.update({ where: { id }, data });
  }
}
