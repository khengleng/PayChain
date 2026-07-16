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
  ) {}

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
    if (onChain.status === 'confirmed') return this.set(c.id, { status: 'POINTS_BURNED' });
    if (onChain.status === 'failed') return this.set(c.id, { status: 'FAILED', failureReason: 'points burn failed' });
    return c; // pending → retry
  }

  private async stepMint(c: StablecoinConversion): Promise<StablecoinConversion> {
    const claimed = await this.claim(c.id, 'POINTS_BURNED', 'STABLECOIN_MINT_PENDING');
    if (!claimed) return this.load(c.tenantId, c.id);
    const to = await this.loadAsset(c.tenantId, c.toAssetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: c.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (!to.issuerSecretEnc) throw new BadRequestException('Stablecoin issuer has no managed key');
    try {
      await this.chain.issueAsset({
        correlationId: c.correlationId,
        assetCode: to.assetCode,
        issuerPublicKey: to.issuerPublicKey,
        issuerSecretKey: this.crypto.decrypt(to.issuerSecretEnc),
        destinationPublicKey: wallet.stellarAccountId,
        amount: c.stablecoinAmount,
      });
      return this.set(c.id, { status: 'COMPLETED' });
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
