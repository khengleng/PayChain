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
import { assertWalletCanTransact } from '../wallets/wallet-status';
import { WalletPolicyService } from '../wallets/wallet-policy.service';
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
    private readonly walletPolicy: WalletPolicyService,
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
        return this.stepValidate(r);
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

  /**
   * Eligibility and KYC (§25).
   *
   * This step used to be `set(VALIDATING, { kycValidated: true })` — an unconditional pass. The
   * field name asserted a check that did not exist, which is worse than having no field: a
   * reviewer reading the record sees "kycValidated: true" and reasonably concludes someone
   * verified something.
   *
   * It now resolves the wallet's §27 policy, which is where a KYC level, sanctions status, EDD
   * flag and redemption eligibility are actually recorded. kycValidated becomes true only if that
   * passes, and carries the level that was relied on.
   *
   * Ownership is checked HERE rather than only at burn: §25 lists it under eligibility, and
   * finding out at burn time means the fiat has already gone out.
   */
  private async stepValidate(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: r.walletId } });
    if (!wallet || wallet.tenantId !== r.tenantId) {
      return this.set(r.id, {
        status: 'REJECTED',
        failureReason: 'redeemer wallet not found for this tenant',
      });
    }

    try {
      // Reuses the §27 guard rather than a second copy of the rules: kycLevel !== NONE,
      // sanctions CLEAR, no outstanding EDD, redemptionEligible, and the daily send limit.
      await this.walletPolicy.assertAllowed({
        tenantId: r.tenantId,
        walletId: wallet.id,
        assetId: r.assetId,
        operation: 'REDEEM',
        amount: r.amount,
      });
    } catch (err) {
      // A failed eligibility check is a REJECTION with its reason, not a crash: the customer and
      // an auditor both need to know which control refused.
      return this.set(r.id, {
        status: 'REJECTED',
        kycValidated: false,
        failureReason: err instanceof Error ? err.message : 'redemption not permitted',
      });
    }

    const policy = await this.walletPolicy.resolve(wallet.id, r.assetId);
    await this.audit.record({
      tenantId: r.tenantId,
      actor: 'system:redemption',
      action: 'redemption.eligibility.validated',
      resourceType: 'stablecoin_redemption',
      resourceId: r.id,
      correlationId: r.correlationId,
      // Records WHICH level was relied on. "kycValidated: true" alone tells a reviewer nothing
      // about what was actually verified.
      metadata: { kycLevel: policy?.kycLevel ?? null, redemptionEligible: policy?.redemptionEligible ?? null },
    });

    return this.set(r.id, { status: 'VALIDATING', kycValidated: true });
  }

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
    // Concurrency guard: atomically claim FIAT_PAYOUT_CONFIRMED → BURN_PENDING so only one
    // caller burns. A crash after this claim leaves BURN_PENDING with no burnHash, which
    // stepConfirmBurn routes to MANUAL_REVIEW — never a second burn.
    const claimed = await this.claim(r.id, 'FIAT_PAYOUT_CONFIRMED', 'BURN_PENDING');
    if (!claimed) return this.load(r.tenantId, r.id);

    const { asset } = await this.loadActive(r.tenantId, r.assetId);
    // Tenant-scoped, and status-checked: burning from a wallet loaded by raw id meant a
    // redemption could name any wallet on the platform, and a FROZEN wallet could still be
    // burned from — the freeze control does not reach code that bypasses requireSecret.
    const wallet = await this.prisma.wallet.findUnique({ where: { id: r.walletId } });
    if (!wallet || wallet.tenantId !== r.tenantId) {
      throw new NotFoundException('Redeemer wallet not found');
    }
    assertWalletCanTransact(wallet);
    // §27: redemptionEligible is an explicit grant, not a default.
    await this.walletPolicy.assertAllowed({
      tenantId: r.tenantId,
      walletId: wallet.id,
      assetId: r.assetId,
      operation: 'REDEEM',
      amount: r.amount,
    });
    if (!wallet.stellarSecretEnc) throw new BadRequestException('Redeemer wallet has no managed key');
    const res = await this.chain.burnAsset({
      correlationId: r.correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      holderPublicKey: wallet.stellarAccountId,
      holderSecretKey: this.crypto.decrypt(wallet.stellarSecretEnc),
      amount: r.amount,
    });
    await this.prisma.transaction.create({
      data: {
        tenantId: r.tenantId,
        type: 'ASSET_BURNED',
        status: 'PENDING_CONFIRMATION',
        blockchainHash: res.transactionHash,
        assetId: r.assetId,
        amount: r.amount,
        correlationId: r.correlationId,
        sourceWalletId: wallet.id,
        createdBy: r.requestedBy,
        approvedBy: r.approvedBy ?? null,
        submittedAt: new Date(),
      },
    });
    return this.set(r.id, { burnHash: res.transactionHash });
  }

  private async claim(id: string, from: string, to: string): Promise<boolean> {
    const res = await this.prisma.stablecoinRedemption.updateMany({
      where: { id, status: from as never },
      data: { status: to as never },
    });
    return res.count === 1;
  }

  private async stepConfirmBurn(r: StablecoinRedemption): Promise<StablecoinRedemption> {
    if (!r.burnHash) return this.set(r.id, { status: 'MANUAL_REVIEW', failureReason: 'missing burn hash' });
    const onChain = await this.chain.getTransaction({ transactionHash: r.burnHash });
    if (onChain.status === 'confirmed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: r.burnHash, type: 'ASSET_BURNED' },
        data: { status: 'CONFIRMED', confirmedAt: new Date(), failureReason: null, failureCode: null },
      });
      return this.set(r.id, { status: 'BURN_CONFIRMED' });
    }
    if (onChain.status === 'failed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: r.burnHash, type: 'ASSET_BURNED' },
        data: { status: 'FAILED', failureReason: 'burn failed', failureCode: 'CHAIN_FAILED' },
      });
      return this.set(r.id, { status: 'FAILED', failureReason: 'burn failed' });
    }
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
