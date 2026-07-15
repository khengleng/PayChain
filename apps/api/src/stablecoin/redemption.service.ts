import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { ComplianceProvider } from '@paychain/compliance';
import type { Asset, StablecoinConfig, StablecoinRedemption } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { COMPLIANCE_PROVIDER } from '../compliance/compliance.module';
import { assertValidAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import { FIAT_PAYOUT_PROVIDER, type FiatPayoutProvider } from './providers/providers.module';

/**
 * Redemption engine (§25, §0.8). Default safe sequencing: escrow hold → fiat payout
 * authorization → burn on payout confirmation. A redemption is COMPLETED only when BOTH the
 * fiat payout and the on-chain burn are confirmed. Partial failures leave the saga in a
 * recoverable state and never double-burn (the burn step keys off a persisted hash).
 */
@Injectable()
export class RedemptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(COMPLIANCE_PROVIDER) private readonly compliance: ComplianceProvider,
    @Inject(FIAT_PAYOUT_PROVIDER) private readonly payout: FiatPayoutProvider,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  async request(
    auth: AuthContext,
    assetId: string,
    input: { walletId: string; amount: string; bankAccountReference: string },
    correlationId: string,
  ): Promise<StablecoinRedemption> {
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.redemption.enabled', auth.tenantId);
    assertValidAmount(input.amount);
    const { config } = await this.loadActive(auth.tenantId, assetId);
    this.assertWithinRedemptionBounds(config, input.amount);

    const created = await this.prisma.stablecoinRedemption.create({
      data: {
        tenantId: auth.tenantId,
        assetId,
        walletId: input.walletId,
        amount: input.amount,
        bankAccountReference: input.bankAccountReference,
        status: 'REQUESTED',
        requestedBy: auth.clientId,
        correlationId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.redemption.request',
      resourceType: 'stablecoin_redemption',
      resourceId: created.id,
      correlationId,
      metadata: { assetId, amount: input.amount },
    });
    return created;
  }

  async approve(auth: AuthContext, id: string): Promise<StablecoinRedemption> {
    const r = await this.load(auth.tenantId, id);
    if (r.status !== 'APPROVAL_REQUIRED') {
      throw new BadRequestException(`Redemption is not awaiting approval (status=${r.status})`);
    }
    if (r.requestedBy === auth.clientId) {
      throw new ForbiddenException('The requester of a redemption cannot approve it');
    }
    return this.set(r.id, { status: 'APPROVED', approvedBy: auth.clientId });
  }

  async advance(tenantId: string, id: string): Promise<StablecoinRedemption> {
    const r = await this.load(tenantId, id);
    switch (r.status) {
      case 'REQUESTED':
        return this.set(r.id, { status: 'VALIDATING', kycValidated: true });
      case 'VALIDATING':
        return this.stepCompliance(r);
      case 'COMPLIANCE_REVIEW':
        return this.stepCompliance(r);
      case 'APPROVED':
        return this.set(r.id, { status: 'ESCROW_HELD' }); // hold before any external payout
      case 'ESCROW_HELD':
        return this.stepInitiatePayout(r);
      case 'FIAT_PAYOUT_PENDING':
        return this.stepCheckPayout(r);
      case 'FIAT_PAYOUT_CONFIRMED':
        return this.stepBurn(r); // burn only AFTER payout confirmed (§0.8)
      case 'BURN_PENDING':
        return this.stepConfirmBurn(r);
      case 'BURN_CONFIRMED':
        return this.set(r.id, { status: 'COMPLETED' }); // both legs confirmed
      default:
        return r; // APPROVAL_REQUIRED waits; terminal states are no-ops
    }
  }

  async get(tenantId: string, id: string): Promise<StablecoinRedemption> {
    return this.load(tenantId, id);
  }

  // --- saga steps ----------------------------------------------------------

  private async stepCompliance(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    const screen = await this.compliance.screenTransaction({
      tenantId: r.tenantId,
      amount: r.amount,
      assetCode: 'STABLECOIN',
    });
    if (screen.decision === 'BLOCKED') {
      return this.set(r.id, { status: 'REJECTED', sanctionsResult: 'BLOCKED', failureReason: 'compliance blocked' });
    }
    if (screen.decision === 'REVIEW') {
      return this.set(r.id, { status: 'MANUAL_REVIEW', amlResult: 'REVIEW' });
    }
    return this.set(r.id, { status: 'APPROVAL_REQUIRED', amlResult: 'CLEAR', sanctionsResult: 'CLEAR' });
  }

  private async stepInitiatePayout(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    if (!r.bankAccountReference) {
      return this.set(r.id, { status: 'MANUAL_REVIEW', failureReason: 'missing bank account reference' });
    }
    const res = await this.payout.initiatePayout({
      tenantId: r.tenantId,
      amount: r.amount,
      bankAccountReference: r.bankAccountReference,
      correlationId: r.correlationId,
    });
    return this.set(r.id, { status: 'FIAT_PAYOUT_PENDING', payoutReference: res.payoutReference });
  }

  private async stepCheckPayout(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    if (!r.payoutReference) return this.set(r.id, { status: 'MANUAL_REVIEW', failureReason: 'missing payout reference' });
    const status = await this.payout.getPayoutStatus(r.payoutReference);
    if (status === 'CONFIRMED') return this.set(r.id, { status: 'FIAT_PAYOUT_CONFIRMED' });
    if (status === 'FAILED') return this.set(r.id, { status: 'FAILED', failureReason: 'fiat payout failed — escrow retained' });
    return r; // PENDING → recoverable, retry later
  }

  private async stepBurn(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    const { asset } = await this.loadActive(r.tenantId, r.assetId);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: r.walletId } });
    if (!wallet?.stellarSecretEnc) throw new BadRequestException('Redeemer wallet has no managed key');
    const res = await this.chain.burnAsset({
      correlationId: r.correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      holderPublicKey: wallet.stellarAccountId,
      holderSecretKey: this.crypto.decrypt(wallet.stellarSecretEnc),
      amount: r.amount,
    });
    return this.set(r.id, { status: 'BURN_PENDING', burnHash: res.transactionHash });
  }

  private async stepConfirmBurn(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    if (!r.burnHash) return this.set(r.id, { status: 'MANUAL_REVIEW', failureReason: 'missing burn hash' });
    const onChain = await this.chain.getTransaction({ transactionHash: r.burnHash });
    if (onChain.status === 'confirmed') return this.set(r.id, { status: 'BURN_CONFIRMED' });
    if (onChain.status === 'failed') return this.set(r.id, { status: 'FAILED', failureReason: 'burn failed' });
    return r; // pending → stay BURN_PENDING, do not re-burn
  }

  // --- helpers -------------------------------------------------------------

  private assertWithinRedemptionBounds(config: StablecoinConfig, amount: string): void {
    if (config.minimumRedemptionAmount && Number(amount) < Number(config.minimumRedemptionAmount)) {
      throw new BadRequestException('Below minimum redemption amount');
    }
    if (config.maximumRedemptionAmount && Number(amount) > Number(config.maximumRedemptionAmount)) {
      throw new BadRequestException('Above maximum redemption amount');
    }
  }

  private async loadActive(tenantId: string, assetId: string): Promise<{ asset: Asset; config: StablecoinConfig }> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId }, include: { stablecoinConfig: true } });
    if (!asset || asset.tenantId !== tenantId || !asset.stablecoinConfig) throw new NotFoundException('Stablecoin not found');
    if (asset.stablecoinConfig.lifecycleState !== 'ACTIVE') {
      throw new BadRequestException(`Stablecoin is not ACTIVE (state=${asset.stablecoinConfig.lifecycleState})`);
    }
    return { asset, config: asset.stablecoinConfig };
  }

  private async load(tenantId: string, id: string): Promise<StablecoinRedemption> {
    const r = await this.prisma.stablecoinRedemption.findUnique({ where: { id } });
    if (!r || r.tenantId !== tenantId) throw new NotFoundException('Redemption not found');
    return r;
  }

  private async set(id: string, data: Record<string, unknown>): Promise<StablecoinRedemption> {
    return this.prisma.stablecoinRedemption.update({ where: { id }, data });
  }
}
