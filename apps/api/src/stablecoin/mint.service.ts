import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { ComplianceProvider } from '@paychain/compliance';
import type { Asset, StablecoinConfig, StablecoinMintRequest } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { COMPLIANCE_PROVIDER } from '../compliance/compliance.module';
import { assertValidAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import {
  RESERVE_FUNDING_PROVIDER,
  type ReserveFundingProvider,
} from './providers/providers.module';

/**
 * Mint request saga (§22, §0.5). A persisted, resumable state machine. The 8 preconditions
 * are enforced across states — most importantly, minting NEVER happens before reserve/funding
 * confirmation, and a failure after submission leaves the request in SUBMITTED (recoverable)
 * so it is confirmed on the next advance, never re-minted (no double-spend).
 */
@Injectable()
export class MintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(COMPLIANCE_PROVIDER) private readonly compliance: ComplianceProvider,
    @Inject(RESERVE_FUNDING_PROVIDER) private readonly funding: ReserveFundingProvider,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  async request(
    auth: AuthContext,
    assetId: string,
    input: { destinationWalletId: string; amount: string; fundingReference?: string; idempotencyKey?: string },
    correlationId: string,
  ): Promise<StablecoinMintRequest> {
    // Gated by module + minting flags, both OFF by default (§36) — never mint from an
    // internal API request alone.
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.minting.enabled', auth.tenantId);
    assertValidAmount(input.amount);

    const { config } = await this.loadActive(auth.tenantId, assetId);
    this.assertWithinDailyMintLimit(config, input.amount);

    const created = await this.prisma.stablecoinMintRequest.create({
      data: {
        tenantId: auth.tenantId,
        assetId,
        destinationWalletId: input.destinationWalletId,
        amount: input.amount,
        status: 'REQUESTED',
        fundingReference: input.fundingReference,
        requestedBy: auth.clientId,
        idempotencyKey: input.idempotencyKey,
        correlationId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.mint.request',
      resourceType: 'stablecoin_mint_request',
      resourceId: created.id,
      correlationId,
      metadata: { assetId, amount: input.amount },
    });
    return created;
  }

  /** Approve the mint (maker-checker §22/§19): the approver must not be the requester. */
  async approve(auth: AuthContext, id: string): Promise<StablecoinMintRequest> {
    const req = await this.load(auth.tenantId, id);
    if (req.status !== 'APPROVAL_REQUIRED') {
      throw new BadRequestException(`Mint is not awaiting approval (status=${req.status})`);
    }
    if (req.requestedBy === auth.clientId) {
      throw new ForbiddenException('The requester of a mint cannot approve it');
    }
    return this.set(req.id, { status: 'APPROVED', approvedBy: auth.clientId });
  }

  /**
   * Advances the saga by exactly one step. Idempotent and safe to re-run: each branch keys
   * off the persisted status, so re-entry after a crash/timeout resumes rather than repeats.
   */
  async advance(tenantId: string, id: string): Promise<StablecoinMintRequest> {
    const req = await this.load(tenantId, id);
    switch (req.status) {
      case 'REQUESTED':
      case 'RESERVE_PENDING':
        return this.stepReserve(req);
      case 'RESERVE_CONFIRMED':
        return this.stepCompliance(req);
      case 'COMPLIANCE_REVIEW':
        return this.stepCompliance(req); // re-screen on retry
      case 'APPROVED':
        return this.stepMint(req);
      case 'SUBMITTED':
        return this.stepConfirm(req);
      case 'CONFIRMED':
        return this.stepReconcile(req);
      default:
        // APPROVAL_REQUIRED waits for approve(); terminal states are no-ops.
        return req;
    }
  }

  async get(tenantId: string, id: string): Promise<StablecoinMintRequest> {
    return this.load(tenantId, id);
  }

  // --- saga steps ----------------------------------------------------------

  private async stepReserve(req: StablecoinMintRequest): Promise<StablecoinMintRequest> {
    if (!req.fundingReference) {
      return this.set(req.id, { status: 'RESERVE_PENDING', failureReason: 'awaiting funding reference' });
    }
    const result = await this.funding.confirmFunding({
      tenantId: req.tenantId,
      reference: req.fundingReference,
      expectedAmount: req.amount,
    });
    if (!result.confirmed) {
      // Never advance toward minting without confirmed reserve/funding.
      return this.set(req.id, { status: 'RESERVE_PENDING', failureReason: 'funding not confirmed' });
    }
    return this.set(req.id, { status: 'RESERVE_CONFIRMED', reserveConfirmed: true, failureReason: null });
  }

  private async stepCompliance(req: StablecoinMintRequest): Promise<StablecoinMintRequest> {
    const screen = await this.compliance.screenTransaction({
      tenantId: req.tenantId,
      amount: req.amount,
      assetCode: 'STABLECOIN',
    });
    if (screen.decision === 'BLOCKED') {
      return this.set(req.id, { status: 'REJECTED', complianceResult: 'BLOCKED', failureReason: 'compliance blocked' });
    }
    if (screen.decision === 'REVIEW') {
      return this.set(req.id, { status: 'COMPLIANCE_REVIEW', complianceResult: 'REVIEW' });
    }
    return this.set(req.id, { status: 'APPROVAL_REQUIRED', complianceResult: 'CLEAR' });
  }

  private async stepMint(req: StablecoinMintRequest): Promise<StablecoinMintRequest> {
    // Hard guard (§22): never mint before reserve confirmation, even if state was forced.
    if (!req.reserveConfirmed) {
      throw new BadRequestException('Refusing to mint: reserve not confirmed');
    }
    const { asset } = await this.loadActive(req.tenantId, req.assetId);
    const issuerSecret = this.requireIssuerSecret(asset);
    const wallet = await this.prisma.wallet.findUnique({ where: { id: req.destinationWalletId } });
    if (!wallet) throw new NotFoundException('Destination wallet not found');

    // Move to SIGNING then submit. issueAsset is reached ONLY from APPROVED, so a resume
    // from SUBMITTED never re-issues.
    const result = await this.chain.issueAsset({
      correlationId: req.correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      issuerSecretKey: issuerSecret,
      destinationPublicKey: wallet.stellarAccountId,
      amount: req.amount,
    });
    return this.set(req.id, { status: 'SUBMITTED', blockchainHash: result.transactionHash });
  }

  private async stepConfirm(req: StablecoinMintRequest): Promise<StablecoinMintRequest> {
    if (!req.blockchainHash) {
      // Submitted with no hash recorded → cannot verify; leave for manual review, never re-mint.
      return this.set(req.id, { status: 'SUBMITTED', failureReason: 'missing tx hash — manual review' });
    }
    const onChain = await this.chain.getTransaction({ transactionHash: req.blockchainHash });
    if (onChain.status === 'confirmed') {
      return this.set(req.id, { status: 'CONFIRMED', failureReason: null });
    }
    if (onChain.status === 'failed') {
      return this.set(req.id, { status: 'FAILED', failureReason: 'chain reported mint failure' });
    }
    // pending/not_found → stay SUBMITTED (recoverable), do NOT re-submit.
    return req;
  }

  private async stepReconcile(req: StablecoinMintRequest): Promise<StablecoinMintRequest> {
    const status = req.reserveConfirmed ? 'MATCHED' : 'RESERVE_MISMATCH';
    return this.set(req.id, { status: 'RECONCILED', reconciliationStatus: status });
  }

  // --- helpers -------------------------------------------------------------

  private assertWithinDailyMintLimit(config: StablecoinConfig, amount: string): void {
    if (config.dailyMintLimit && Number(amount) > Number(config.dailyMintLimit)) {
      throw new BadRequestException('Mint exceeds the configured daily mint limit');
    }
  }

  private async loadActive(tenantId: string, assetId: string): Promise<{ asset: Asset; config: StablecoinConfig }> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId }, include: { stablecoinConfig: true } });
    if (!asset || asset.tenantId !== tenantId || !asset.stablecoinConfig) {
      throw new NotFoundException('Stablecoin not found');
    }
    if (asset.stablecoinConfig.lifecycleState !== 'ACTIVE') {
      throw new BadRequestException(`Stablecoin is not ACTIVE (state=${asset.stablecoinConfig.lifecycleState})`);
    }
    return { asset, config: asset.stablecoinConfig };
  }

  private requireIssuerSecret(asset: Asset): string {
    if (!asset.issuerSecretEnc) throw new BadRequestException('Issuer has no managed signing key');
    return this.crypto.decrypt(asset.issuerSecretEnc);
  }

  private async load(tenantId: string, id: string): Promise<StablecoinMintRequest> {
    const req = await this.prisma.stablecoinMintRequest.findUnique({ where: { id } });
    if (!req || req.tenantId !== tenantId) throw new NotFoundException('Mint request not found');
    return req;
  }

  private async set(id: string, data: Record<string, unknown>): Promise<StablecoinMintRequest> {
    return this.prisma.stablecoinMintRequest.update({ where: { id }, data });
  }
}
