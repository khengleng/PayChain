import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { AssetType, StablecoinConfig } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import type { AuthContext } from '../auth/auth-context';
import {
  canActivate,
  canTransition,
  khrMayLeaveLegalReview,
  missingActivationGates,
  type ApprovalGate,
  type StablecoinState,
} from './lifecycle';
import type { ApproveGateDto, CreateStablecoinDto, SuspendDto } from './dto';

@Injectable()
export class StablecoinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  /**
   * Creates a stablecoin asset + control-plane config in DRAFT (§14, §15). Gated by the
   * module + creation feature flags, which default OFF (§36) — so public issuance is never
   * enabled by accident. No minting happens here.
   */
  async create(auth: AuthContext, dto: CreateStablecoinDto, correlationId: string) {
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.creation.enabled', auth.tenantId);

    const issuer = await this.chain.createWallet({ correlationId });
    const asset = await this.prisma.asset.create({
      data: {
        tenantId: auth.tenantId,
        assetCode: dto.assetCode,
        assetName: dto.assetName,
        assetType: dto.classification as AssetType,
        status: 'DRAFT',
        issuerPublicKey: issuer.publicKey,
        issuerSecretEnc: issuer.secretKey ? this.crypto.encrypt(issuer.secretKey) : null,
        transferability: false, // stablecoin transfers are separately flag-gated (§36)
        redeemability: false,
        createdBy: auth.clientId,
        stablecoinConfig: {
          create: {
            tenantId: auth.tenantId,
            classification: dto.classification,
            referenceCurrency: dto.referenceCurrency,
            lifecycleState: 'DRAFT',
            reserveRatioTarget: dto.reserveRatioTarget ?? '1.0',
            issuerLegalEntity: dto.issuerLegalEntity,
            jurisdiction: dto.jurisdiction,
            createdBy: auth.clientId,
          },
        },
      },
      include: { stablecoinConfig: true },
    });

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.create',
      resourceType: 'stablecoin',
      resourceId: asset.stablecoinConfig?.id,
      correlationId,
      metadata: { assetCode: dto.assetCode, classification: dto.classification, referenceCurrency: dto.referenceCurrency },
    });
    return this.view(asset.stablecoinConfig!, asset.assetCode);
  }

  async list(auth: AuthContext) {
    const configs = await this.prisma.stablecoinConfig.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { asset: true },
    });
    return configs.map((c) => this.view(c, c.asset.assetCode));
  }

  async get(auth: AuthContext, id: string) {
    const { config, assetCode } = await this.load(auth.tenantId, id);
    return this.view(config, assetCode);
  }

  async submitForReview(auth: AuthContext, id: string, correlationId: string) {
    return this.transition(auth, id, 'LEGAL_REVIEW', correlationId);
  }

  /** Records a maker-checker gate approval (§15, §19). Approver must not be the maker. */
  async approveGate(auth: AuthContext, id: string, dto: ApproveGateDto, correlationId: string) {
    const { config } = await this.load(auth.tenantId, id);
    if (config.createdBy && config.createdBy === auth.clientId) {
      throw new ForbiddenException('The maker of a stablecoin cannot approve its gates');
    }
    await this.prisma.stablecoinApproval.upsert({
      where: { stablecoinConfigId_gate: { stablecoinConfigId: config.id, gate: dto.gate } },
      create: { stablecoinConfigId: config.id, gate: dto.gate, approvedBy: auth.clientId, note: dto.note },
      update: { approvedBy: auth.clientId, note: dto.note },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.gate.approved',
      resourceType: 'stablecoin',
      resourceId: config.id,
      correlationId,
      metadata: { gate: dto.gate },
    });
    return this.get(auth, id);
  }

  async advance(auth: AuthContext, id: string, toState: string, correlationId: string) {
    return this.transition(auth, id, toState as StablecoinState, correlationId);
  }

  async suspend(auth: AuthContext, id: string, dto: SuspendDto, correlationId: string) {
    return this.transition(auth, id, dto.mode as StablecoinState, correlationId);
  }

  // --- internals -----------------------------------------------------------

  private async transition(
    auth: AuthContext,
    id: string,
    toState: StablecoinState,
    correlationId: string,
  ) {
    const { config, assetCode } = await this.load(auth.tenantId, id);
    const from = config.lifecycleState as StablecoinState;
    if (!canTransition(from, toState)) {
      throw new BadRequestException(`Illegal lifecycle transition ${from} → ${toState}`);
    }

    const approved = await this.approvedGates(config.id);

    // KHR coins may not leave LEGAL_REVIEW without a recorded legal sign-off (§0.6).
    if (from === 'LEGAL_REVIEW' && !khrMayLeaveLegalReview(config.referenceCurrency, approved)) {
      throw new ForbiddenException(
        'KHR-referenced stablecoins require a recorded LEGAL approval before leaving LEGAL_REVIEW',
      );
    }

    // Activation requires the module flag AND every approval gate (§15, §36).
    if (toState === 'ACTIVE') {
      await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
      if (!canActivate(approved)) {
        throw new BadRequestException(
          `Cannot activate: missing approval gate(s): ${missingActivationGates(approved).join(', ')}`,
        );
      }
    }

    const updated = await this.prisma.stablecoinConfig.update({
      where: { id: config.id },
      data: {
        lifecycleState: toState,
        activationStatus: toState === 'ACTIVE' ? 'ACTIVE' : config.activationStatus,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.transition',
      resourceType: 'stablecoin',
      resourceId: config.id,
      correlationId,
      metadata: { from, to: toState },
    });
    return this.view(updated, assetCode);
  }

  private async approvedGates(configId: string): Promise<ApprovalGate[]> {
    const rows = await this.prisma.stablecoinApproval.findMany({
      where: { stablecoinConfigId: configId },
      select: { gate: true },
    });
    return rows.map((r) => r.gate as ApprovalGate);
  }

  private async load(tenantId: string, id: string): Promise<{ config: StablecoinConfig; assetCode: string }> {
    const config = await this.prisma.stablecoinConfig.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!config || config.tenantId !== tenantId) throw new NotFoundException('Stablecoin not found');
    return { config, assetCode: config.asset.assetCode };
  }

  private view(config: StablecoinConfig, assetCode: string) {
    return {
      id: config.id,
      assetId: config.assetId,
      assetCode,
      classification: config.classification,
      referenceCurrency: config.referenceCurrency,
      lifecycleState: config.lifecycleState,
      activationStatus: config.activationStatus,
      reserveRatioTarget: config.reserveRatioTarget,
      jurisdiction: config.jurisdiction,
      createdAt: config.createdAt,
    };
  }
}
