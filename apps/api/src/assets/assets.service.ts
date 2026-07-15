import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BlockchainProvider,
  BlockchainTransactionResult,
} from '@paychain/blockchain';
import type { Asset, TransactionType } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import { BalanceService } from '../wallets/balance.service';
import { WalletsService } from '../wallets/wallets.service';
import { WebhookEmitterService } from '../webhooks/webhook-emitter.service';
import { assertValidAmount } from '../common/money';
import type { CreateAssetDto } from './dto';

// Maps a transaction type to its outbound webhook event name (§35).
const TX_EVENT_NAME: Partial<Record<TransactionType, string>> = {
  ASSET_ISSUED: 'asset.issued',
  ASSET_TRANSFERRED: 'asset.transferred',
  ASSET_REDEEMED: 'asset.redeemed',
  ASSET_BURNED: 'asset.burned',
};

export interface AssetView {
  id: string;
  assetCode: string;
  assetName: string;
  assetType: string;
  status: string;
  issuerPublicKey: string;
  createdAt: Date;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly wallets: WalletsService,
    private readonly balances: BalanceService,
    private readonly webhooks: WebhookEmitterService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  /**
   * Creates a loyalty asset with an isolated issuer account (§11 — issuer keys are
   * separate and used only for issuance, never routine transfers). The issuer account is
   * funded on testnet so it can pay its own reserves. Maker-checker on asset creation is
   * a documented later-milestone control (§11); M0 records the action in the audit log.
   */
  async create(auth: AuthContext, dto: CreateAssetDto, correlationId: string): Promise<AssetView> {
    const issuer = await this.chain.createWallet({ correlationId });
    try {
      const asset = await this.prisma.asset.create({
        data: {
          tenantId: auth.tenantId,
          assetCode: dto.assetCode,
          assetName: dto.assetName,
          assetType: dto.assetType ?? 'LOYALTY_POINT',
          status: 'DRAFT',
          issuerPublicKey: issuer.publicKey,
          issuerSecretEnc: issuer.secretKey ? this.crypto.encrypt(issuer.secretKey) : null,
          createdBy: auth.clientId,
        },
      });
      await this.audit.record({
        tenantId: auth.tenantId,
        actor: auth.clientId,
        action: 'asset.create',
        resourceType: 'asset',
        resourceId: asset.id,
        correlationId,
        metadata: { assetCode: asset.assetCode, issuerPublicKey: asset.issuerPublicKey },
      });
      return this.toView(asset);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Asset code already exists for this tenant');
      }
      throw err;
    }
  }

  async activate(auth: AuthContext, assetId: string, correlationId: string): Promise<AssetView> {
    const asset = await this.getOwned(auth.tenantId, assetId);
    const updated = await this.prisma.asset.update({
      where: { id: asset.id },
      data: { status: 'ACTIVE' },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'asset.activate',
      resourceType: 'asset',
      resourceId: asset.id,
      correlationId,
    });
    return this.toView(updated);
  }

  async list(auth: AuthContext): Promise<AssetView[]> {
    const assets = await this.prisma.asset.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return assets.map((a) => this.toView(a));
  }

  async get(auth: AuthContext, assetId: string): Promise<AssetView> {
    return this.toView(await this.getOwned(auth.tenantId, assetId));
  }

  /** Issue (mint) asset from the issuer to a destination wallet, ensuring a trustline. */
  async issue(
    auth: AuthContext,
    assetId: string,
    destinationWalletId: string,
    amount: string,
    correlationId: string,
  ): Promise<TransactionRecordView> {
    assertValidAmount(amount);
    const asset = await this.requireActive(auth.tenantId, assetId);
    const dest = await this.wallets.requireSecret(auth.tenantId, destinationWalletId);
    const issuerSecret = this.requireIssuerSecret(asset);

    await this.ensureTrustline(asset, dest.wallet.stellarAccountId, dest.secret, correlationId);

    const result = await this.chain.issueAsset({
      correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      issuerSecretKey: issuerSecret,
      destinationPublicKey: dest.wallet.stellarAccountId,
      amount,
    });

    const tx = await this.finalizeTransaction({
      auth,
      type: 'ASSET_ISSUED',
      asset,
      result,
      amount,
      correlationId,
      destinationWalletId: dest.wallet.id,
    });
    await this.balances.refreshFromChain({
      tenantId: auth.tenantId,
      walletId: dest.wallet.id,
      stellarAccountId: dest.wallet.stellarAccountId,
    });
    return tx;
  }

  async transfer(
    auth: AuthContext,
    assetId: string,
    sourceWalletId: string,
    destinationWalletId: string,
    amount: string,
    correlationId: string,
  ): Promise<TransactionRecordView> {
    assertValidAmount(amount);
    const asset = await this.requireActive(auth.tenantId, assetId);
    if (!asset.transferability) {
      throw new BadRequestException('Asset is not transferable');
    }
    const source = await this.wallets.requireSecret(auth.tenantId, sourceWalletId);
    const dest = await this.wallets.requireSecret(auth.tenantId, destinationWalletId);

    await this.ensureTrustline(asset, dest.wallet.stellarAccountId, dest.secret, correlationId);

    const result = await this.chain.transferAsset({
      correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      sourcePublicKey: source.wallet.stellarAccountId,
      sourceSecretKey: source.secret,
      destinationPublicKey: dest.wallet.stellarAccountId,
      amount,
    });

    const tx = await this.finalizeTransaction({
      auth,
      type: 'ASSET_TRANSFERRED',
      asset,
      result,
      amount,
      correlationId,
      sourceWalletId: source.wallet.id,
      destinationWalletId: dest.wallet.id,
    });
    await Promise.all([
      this.balances.refreshFromChain({
        tenantId: auth.tenantId,
        walletId: source.wallet.id,
        stellarAccountId: source.wallet.stellarAccountId,
      }),
      this.balances.refreshFromChain({
        tenantId: auth.tenantId,
        walletId: dest.wallet.id,
        stellarAccountId: dest.wallet.stellarAccountId,
      }),
    ]);
    return tx;
  }

  async redeem(
    auth: AuthContext,
    assetId: string,
    sourceWalletId: string,
    amount: string,
    correlationId: string,
  ): Promise<TransactionRecordView> {
    assertValidAmount(amount);
    const asset = await this.requireActive(auth.tenantId, assetId);
    if (!asset.redeemability) {
      throw new BadRequestException('Asset is not redeemable');
    }
    const source = await this.wallets.requireSecret(auth.tenantId, sourceWalletId);

    const result = await this.chain.redeemAsset({
      correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      sourcePublicKey: source.wallet.stellarAccountId,
      sourceSecretKey: source.secret,
      amount,
    });

    const tx = await this.finalizeTransaction({
      auth,
      type: 'ASSET_REDEEMED',
      asset,
      result,
      amount,
      correlationId,
      sourceWalletId: source.wallet.id,
    });
    await this.balances.refreshFromChain({
      tenantId: auth.tenantId,
      walletId: source.wallet.id,
      stellarAccountId: source.wallet.stellarAccountId,
    });
    return tx;
  }

  async burn(
    auth: AuthContext,
    assetId: string,
    walletId: string,
    amount: string,
    correlationId: string,
  ): Promise<TransactionRecordView> {
    assertValidAmount(amount);
    const asset = await this.requireActive(auth.tenantId, assetId);
    const holder = await this.wallets.requireSecret(auth.tenantId, walletId);

    const result = await this.chain.burnAsset({
      correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      holderPublicKey: holder.wallet.stellarAccountId,
      holderSecretKey: holder.secret,
      amount,
    });

    const tx = await this.finalizeTransaction({
      auth,
      type: 'ASSET_BURNED',
      asset,
      result,
      amount,
      correlationId,
      sourceWalletId: holder.wallet.id,
    });
    await this.balances.refreshFromChain({
      tenantId: auth.tenantId,
      walletId: holder.wallet.id,
      stellarAccountId: holder.wallet.stellarAccountId,
    });
    return tx;
  }

  // --- internals -----------------------------------------------------------

  private async ensureTrustline(
    asset: Asset,
    accountPublicKey: string,
    accountSecret: string,
    correlationId: string,
  ): Promise<void> {
    const balances = await this.chain.getBalance({ publicKey: accountPublicKey });
    const hasLine = balances.some(
      (b) => b.assetCode === asset.assetCode && b.issuerPublicKey === asset.issuerPublicKey,
    );
    if (hasLine) return;
    await this.chain.establishTrustline({
      correlationId,
      accountPublicKey,
      accountSecretKey: accountSecret,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
    });
  }

  /**
   * Records the operational transaction and verifies confirmation (§17, §40, §47).
   * Submission is not confirmation: we query the chain for the tx status before marking
   * CONFIRMED. Full async confirmation listeners land in M1; M0 confirms inline.
   */
  private async finalizeTransaction(params: {
    auth: AuthContext;
    type: TransactionType;
    asset: Asset;
    result: BlockchainTransactionResult;
    amount: string;
    correlationId: string;
    sourceWalletId?: string;
    destinationWalletId?: string;
  }): Promise<TransactionRecordView> {
    const onChain = await this.chain.getTransaction({
      transactionHash: params.result.transactionHash,
    });
    const confirmed = onChain.status === 'confirmed';
    const record = await this.prisma.transaction.create({
      data: {
        tenantId: params.auth.tenantId,
        type: params.type,
        status: confirmed ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        blockchainHash: params.result.transactionHash,
        assetId: params.asset.id,
        amount: params.amount,
        correlationId: params.correlationId,
        sourceWalletId: params.sourceWalletId,
        destinationWalletId: params.destinationWalletId,
        submittedAt: new Date(),
        confirmedAt: confirmed ? new Date() : null,
      },
    });
    await this.audit.record({
      tenantId: params.auth.tenantId,
      actor: params.auth.clientId,
      action: `transaction.${params.type.toLowerCase()}`,
      resourceType: 'transaction',
      resourceId: record.id,
      correlationId: params.correlationId,
      metadata: { blockchainHash: record.blockchainHash, amount: params.amount },
    });

    // Emit an outbound event for subscribers (§35). eventId = transaction id → the worker
    // delivers it at-most-once per endpoint even if this path is retried.
    const eventType = TX_EVENT_NAME[params.type];
    if (eventType) {
      await this.webhooks.emit({
        tenantId: params.auth.tenantId,
        eventType,
        eventId: record.id,
        payload: {
          transactionId: record.id,
          type: record.type,
          status: record.status,
          assetId: params.asset.id,
          amount: params.amount,
          blockchainHash: record.blockchainHash,
        },
        correlationId: params.correlationId,
      });
    }
    return {
      id: record.id,
      type: record.type,
      status: record.status,
      blockchainHash: record.blockchainHash,
      amount: record.amount,
      correlationId: record.correlationId,
      createdAt: record.createdAt,
    };
  }

  private async requireActive(tenantId: string, assetId: string): Promise<Asset> {
    const asset = await this.getOwned(tenantId, assetId);
    if (asset.status !== 'ACTIVE') {
      throw new BadRequestException(`Asset is not ACTIVE (status=${asset.status})`);
    }
    return asset;
  }

  private async getOwned(tenantId: string, assetId: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.tenantId !== tenantId) {
      throw new NotFoundException('Asset not found');
    }
    return asset;
  }

  private requireIssuerSecret(asset: Asset): string {
    if (!asset.issuerSecretEnc) {
      throw new BadRequestException('Asset issuer has no managed signing key');
    }
    return this.crypto.decrypt(asset.issuerSecretEnc);
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    );
  }

  private toView(a: Asset): AssetView {
    return {
      id: a.id,
      assetCode: a.assetCode,
      assetName: a.assetName,
      assetType: a.assetType,
      status: a.status,
      issuerPublicKey: a.issuerPublicKey,
      createdAt: a.createdAt,
    };
  }
}

export interface TransactionRecordView {
  id: string;
  type: string;
  status: string;
  blockchainHash: string | null;
  amount: string | null;
  correlationId: string;
  createdAt: Date;
}
