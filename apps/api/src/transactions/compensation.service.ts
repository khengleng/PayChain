import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import type { Asset, Transaction } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletsService } from '../wallets/wallets.service';
import { BalanceService } from '../wallets/balance.service';
import { WebhookEmitterService } from '../webhooks/webhook-emitter.service';
import type { AuthContext } from '../auth/auth-context';
import { assertValidAmount } from '../common/money';
import type { CompensateDto } from './dto';

export interface CompensationView {
  id: string;
  status: string;
  amount: string | null;
  reason: string | null;
  compensatesTransactionId: string | null;
  blockchainHash: string | null;
  createdAt: Date;
}

const REVERSIBLE_TYPES = ['ASSET_ISSUED', 'ASSET_TRANSFERRED'];
const OPEN_STATUSES = ['APPROVAL_REQUIRED', 'PENDING_CONFIRMATION', 'CONFIRMED'] as const;

/**
 * Business reversals via compensating transactions (§16, §19). Confirmed blockchain
 * history is never rewritten; instead we submit an offsetting on-chain operation and link
 * it to the original. Reversals at/above a configurable threshold require maker-checker
 * approval — the approver must differ from the maker.
 */
@Injectable()
export class CompensationService {
  private readonly threshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletsService,
    private readonly balances: BalanceService,
    private readonly audit: AuditService,
    private readonly webhooks: WebhookEmitterService,
    @Inject(CONFIG) cfg: PayChainConfig,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {
    this.threshold = cfg.COMPENSATION_APPROVAL_THRESHOLD;
  }

  async compensate(
    auth: AuthContext,
    originalTxId: string,
    dto: CompensateDto,
    correlationId: string,
  ): Promise<CompensationView> {
    assertValidAmount(dto.amount);
    const original = await this.loadOriginal(auth.tenantId, originalTxId);
    await this.assertWithinCompensatable(original, dto.amount);

    if (Number(dto.amount) >= this.threshold) {
      const pending = await this.prisma.transaction.create({
        data: {
          tenantId: auth.tenantId,
          type: 'COMPENSATING_TRANSACTION',
          status: 'APPROVAL_REQUIRED',
          assetId: original.assetId,
          amount: dto.amount,
          businessReason: dto.reason,
          compensatesTransactionId: original.id,
          correlationId,
          createdBy: auth.clientId,
        },
      });
      await this.audit.record({
        tenantId: auth.tenantId,
        actor: auth.clientId,
        action: 'transaction.compensate.pending_approval',
        resourceType: 'transaction',
        resourceId: pending.id,
        correlationId,
        metadata: { originalTransactionId: original.id, amount: dto.amount, reason: dto.reason },
      });
      return this.toView(pending);
    }

    const record = await this.executeReversal(auth, original, dto, correlationId, auth.clientId);
    return this.toView(record);
  }

  async approve(
    auth: AuthContext,
    compensationId: string,
    correlationId: string,
  ): Promise<CompensationView> {
    const comp = await this.loadCompensation(auth.tenantId, compensationId);
    if (comp.status !== 'APPROVAL_REQUIRED') {
      throw new BadRequestException(`Compensation is not awaiting approval (status=${comp.status})`);
    }
    // Maker-checker: the approver must not be the maker (§19).
    if (comp.createdBy && comp.createdBy === auth.clientId) {
      throw new ForbiddenException('The maker of a compensation cannot approve it');
    }
    if (!comp.compensatesTransactionId || !comp.amount) {
      throw new BadRequestException('Compensation is missing its original reference or amount');
    }
    const original = await this.loadOriginal(auth.tenantId, comp.compensatesTransactionId);
    const outcome = await this.performChainReversal(original, comp.amount, correlationId);

    const updated = await this.prisma.transaction.update({
      where: { id: comp.id },
      data: {
        status: outcome.confirmed ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        blockchainHash: outcome.hash,
        approvedBy: auth.clientId,
        submittedAt: new Date(),
        confirmedAt: outcome.confirmed ? new Date() : null,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'transaction.compensate.approved',
      resourceType: 'transaction',
      resourceId: updated.id,
      correlationId,
      metadata: { originalTransactionId: original.id, amount: comp.amount, maker: comp.createdBy },
    });
    await this.emitCompensated(updated);
    return this.toView(updated);
  }

  // --- internals -----------------------------------------------------------

  private async executeReversal(
    auth: AuthContext,
    original: Transaction,
    dto: CompensateDto,
    correlationId: string,
    maker: string,
  ): Promise<Transaction> {
    const outcome = await this.performChainReversal(original, dto.amount, correlationId);
    const record = await this.prisma.transaction.create({
      data: {
        tenantId: auth.tenantId,
        type: 'COMPENSATING_TRANSACTION',
        status: outcome.confirmed ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        assetId: original.assetId,
        amount: dto.amount,
        businessReason: dto.reason,
        compensatesTransactionId: original.id,
        blockchainHash: outcome.hash,
        correlationId,
        createdBy: maker,
        submittedAt: new Date(),
        confirmedAt: outcome.confirmed ? new Date() : null,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: maker,
      action: 'transaction.compensate.executed',
      resourceType: 'transaction',
      resourceId: record.id,
      correlationId,
      metadata: { originalTransactionId: original.id, amount: dto.amount, reason: dto.reason },
    });
    await this.emitCompensated(record);
    return record;
  }

  /** Submits the offsetting on-chain operation for the original transaction. */
  private async performChainReversal(
    original: Transaction,
    amount: string,
    correlationId: string,
  ): Promise<{ hash: string; confirmed: boolean }> {
    const asset = await this.loadAsset(original.assetId);
    let hash: string;

    if (original.type === 'ASSET_ISSUED') {
      // Reverse an issuance by burning the amount from the holder (destination wallet).
      if (!original.destinationWalletId) throw new BadRequestException('Original has no destination wallet');
      const holder = await this.wallets.requireSecret(original.tenantId, original.destinationWalletId);
      const res = await this.chain.burnAsset({
        correlationId,
        assetCode: asset.assetCode,
        issuerPublicKey: asset.issuerPublicKey,
        holderPublicKey: holder.wallet.stellarAccountId,
        holderSecretKey: holder.secret,
        amount,
      });
      hash = res.transactionHash;
      await this.balances.refreshFromChain({
        tenantId: original.tenantId,
        walletId: holder.wallet.id,
        stellarAccountId: holder.wallet.stellarAccountId,
      });
    } else {
      // Reverse a transfer by sending the amount back from destination to source.
      if (!original.destinationWalletId || !original.sourceWalletId) {
        throw new BadRequestException('Original transfer is missing wallet references');
      }
      const from = await this.wallets.requireSecret(original.tenantId, original.destinationWalletId);
      const to = await this.wallets.getOwned(original.tenantId, original.sourceWalletId);
      const res = await this.chain.transferAsset({
        correlationId,
        assetCode: asset.assetCode,
        issuerPublicKey: asset.issuerPublicKey,
        sourcePublicKey: from.wallet.stellarAccountId,
        sourceSecretKey: from.secret,
        destinationPublicKey: to.stellarAccountId,
        amount,
      });
      hash = res.transactionHash;
      await Promise.all([
        this.balances.refreshFromChain({
          tenantId: original.tenantId,
          walletId: from.wallet.id,
          stellarAccountId: from.wallet.stellarAccountId,
        }),
        this.balances.refreshFromChain({
          tenantId: original.tenantId,
          walletId: to.id,
          stellarAccountId: to.stellarAccountId,
        }),
      ]);
    }

    const chainTx = await this.chain.getTransaction({ transactionHash: hash });
    return { hash, confirmed: chainTx.status === 'confirmed' };
  }

  private async assertWithinCompensatable(original: Transaction, amount: string): Promise<void> {
    if (!original.amount) throw new BadRequestException('Original transaction has no amount');
    const priorComps = await this.prisma.transaction.findMany({
      where: {
        compensatesTransactionId: original.id,
        status: { in: [...OPEN_STATUSES] },
      },
      select: { amount: true },
    });
    const already = priorComps.reduce((sum, t) => sum + Number(t.amount ?? '0'), 0);
    if (already + Number(amount) > Number(original.amount)) {
      throw new BadRequestException(
        `Compensation exceeds remaining amount (original=${original.amount}, alreadyCompensated=${already})`,
      );
    }
  }

  private async loadOriginal(tenantId: string, id: string): Promise<Transaction> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.tenantId !== tenantId) throw new NotFoundException('Transaction not found');
    if (!REVERSIBLE_TYPES.includes(tx.type)) {
      throw new BadRequestException(`Transaction type ${tx.type} cannot be compensated`);
    }
    if (tx.status !== 'CONFIRMED') {
      throw new BadRequestException('Only a CONFIRMED transaction can be compensated');
    }
    return tx;
  }

  private async loadCompensation(tenantId: string, id: string): Promise<Transaction> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.tenantId !== tenantId || tx.type !== 'COMPENSATING_TRANSACTION') {
      throw new NotFoundException('Compensation not found');
    }
    return tx;
  }

  private async loadAsset(assetId: string | null): Promise<Asset> {
    if (!assetId) throw new BadRequestException('Original transaction has no asset');
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  private async emitCompensated(record: Transaction): Promise<void> {
    await this.webhooks.emit({
      tenantId: record.tenantId,
      eventType: 'transaction.compensated',
      eventId: record.id,
      payload: {
        transactionId: record.id,
        compensatesTransactionId: record.compensatesTransactionId,
        amount: record.amount,
        status: record.status,
      },
      correlationId: record.correlationId,
    });
  }

  private toView(t: Transaction): CompensationView {
    return {
      id: t.id,
      status: t.status,
      amount: t.amount,
      reason: t.businessReason,
      compensatesTransactionId: t.compensatesTransactionId,
      blockchainHash: t.blockchainHash,
      createdAt: t.createdAt,
    };
  }
}
