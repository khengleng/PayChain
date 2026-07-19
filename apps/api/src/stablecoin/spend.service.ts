import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { Asset, StablecoinConfig, StablecoinSpend } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { assertValidAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import { assertWalletCanTransact } from '../wallets/wallet-status';
import { EscrowService } from '../wallets/escrow.service';
import { BalanceService } from '../wallets/balance.service';
import { PointsLotService } from '../points-lot/points-lot.service';

/**
 * Spend-for-goods saga (§25-adjacent). Disabled by default (stablecoin.spend flag OFF).
 *
 * A PayKH customer spending merchant points on goods: the points ARE a reserve-backed stablecoin,
 * so spending them BURNS supply. Because outstanding supply drops, the reserve that backed the
 * burned points is no longer owed and becomes the merchant's realized revenue — but this saga does
 * NOT move the reserve. Consistent with the confirmed model, the freed reserve is withdrawn by the
 * merchant through the existing maker-checker reserve DEBIT (ReserveService.requestMovement /
 * approveMovement), so every reserve outflow keeps its second-person approval.
 *
 * This is deliberately NOT a StablecoinRedemption: a redemption is a fiat cash-out (KYC, compliance,
 * bank payout, approval); a point-of-sale spend has none of those. What it shares with redemption is
 * the careful burn skeleton: escrow the tokens at request so they cannot be double-spent, atomically
 * claim the burn so only one caller burns, and let supply drop only once the burn is CONFIRMED on
 * chain. ReserveService.getState subtracts spends in BURN_CONFIRMED/COMPLETED — so a burn that is
 * merely submitted (BURN_PENDING) does not yet reduce the backing liability, and a burn that fails
 * never does.
 */
@Injectable()
export class SpendService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly flags: FeatureFlagsService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
    private readonly escrow: EscrowService,
    private readonly balances: BalanceService,
    private readonly pointsLots: PointsLotService,
  ) {}

  /**
   * Refresh the wallet's balance read model from chain after a burn confirms. Best-effort: the
   * chain is authoritative and the reconciler catches any residual drift, so a refresh failure must
   * never fail the saga — but keeping the cache current is what stops the balance reconciler from
   * (correctly) flagging BALANCE_DRIFT after a saga burn, the way AssetsService already does.
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

  async request(
    auth: AuthContext,
    assetId: string,
    input: { walletId: string; amount: string; orderReference?: string },
    correlationId: string,
  ): Promise<StablecoinSpend> {
    await this.flags.requireEnabled('stablecoin.module.enabled', auth.tenantId);
    await this.flags.requireEnabled('stablecoin.spend.enabled', auth.tenantId);
    assertValidAmount(input.amount);
    const { asset } = await this.loadActive(auth.tenantId, assetId);

    // The spender's wallet must be transactable, and must not be spending tokens already committed
    // to a redemption or another in-flight spend. assertSpendable enforces the latter — but only
    // when something is already escrowed (its fast path skips the balance read otherwise), so this
    // is a lien check, not a proof of sufficient balance: the on-chain burn is the authoritative
    // guard and a spend for more than the wallet holds fails safely there (BURN_PENDING with no
    // hash → MANUAL_REVIEW), never an over-burn.
    const wallet = await this.prisma.wallet.findUnique({ where: { id: input.walletId } });
    if (!wallet || wallet.tenantId !== auth.tenantId) throw new NotFoundException('Spender wallet not found');
    assertWalletCanTransact(wallet);
    await this.escrow.assertSpendable({
      walletId: input.walletId,
      assetId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      amount: input.amount,
    });

    const created = await this.prisma.stablecoinSpend.create({
      data: {
        tenantId: auth.tenantId,
        assetId,
        walletId: input.walletId,
        amount: input.amount,
        orderReference: input.orderReference,
        status: 'REQUESTED',
        requestedBy: auth.clientId,
        correlationId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'stablecoin.spend.request',
      resourceType: 'stablecoin_spend',
      resourceId: created.id,
      correlationId,
      metadata: { assetId, amount: input.amount, orderReference: input.orderReference ?? null },
    });
    return created;
  }

  async advance(tenantId: string, id: string): Promise<StablecoinSpend> {
    const s = await this.load(tenantId, id);
    switch (s.status) {
      case 'REQUESTED':
        return this.stepBurn(s);
      case 'BURN_PENDING':
        return this.stepConfirmBurn(s);
      case 'BURN_CONFIRMED':
        return this.set(s.id, { status: 'COMPLETED' }); // supply already counted as reduced
      default:
        return s; // terminal states (COMPLETED/FAILED/MANUAL_REVIEW) are no-ops
    }
  }

  async get(tenantId: string, id: string): Promise<StablecoinSpend> {
    return this.load(tenantId, id);
  }

  // --- saga steps ----------------------------------------------------------

  private async stepBurn(s: StablecoinSpend): Promise<StablecoinSpend> {
    // Concurrency guard: atomically claim REQUESTED → BURN_PENDING so only one caller burns. A
    // crash after this claim leaves BURN_PENDING with no burnHash, which stepConfirmBurn routes to
    // MANUAL_REVIEW — never a second burn.
    const claimed = await this.claim(s.id, 'REQUESTED', 'BURN_PENDING');
    if (!claimed) return this.load(s.tenantId, s.id);

    const { asset } = await this.loadActive(s.tenantId, s.assetId);
    // Re-load and re-check the wallet at burn time: a freeze applied between request and burn must
    // still stop the burn — the freeze control only bites where the signing key is fetched.
    const wallet = await this.prisma.wallet.findUnique({ where: { id: s.walletId } });
    if (!wallet || wallet.tenantId !== s.tenantId) throw new NotFoundException('Spender wallet not found');
    assertWalletCanTransact(wallet);
    if (!wallet.stellarSecretEnc) throw new BadRequestException('Spender wallet has no managed key');

    const res = await this.chain.burnAsset({
      correlationId: s.correlationId,
      assetCode: asset.assetCode,
      issuerPublicKey: asset.issuerPublicKey,
      holderPublicKey: wallet.stellarAccountId,
      holderSecretKey: this.crypto.decrypt(wallet.stellarSecretEnc),
      amount: s.amount,
    });
    await this.prisma.transaction.create({
      data: {
        tenantId: s.tenantId,
        type: 'ASSET_BURNED',
        status: 'PENDING_CONFIRMATION',
        blockchainHash: res.transactionHash,
        assetId: s.assetId,
        amount: s.amount,
        correlationId: s.correlationId,
        sourceWalletId: wallet.id,
        createdBy: s.requestedBy,
        businessReason: 'spend points for goods',
        submittedAt: new Date(),
      },
    });
    return this.set(s.id, { burnHash: res.transactionHash });
  }

  private async claim(id: string, from: string, to: string): Promise<boolean> {
    const res = await this.prisma.stablecoinSpend.updateMany({
      where: { id, status: from as never },
      data: { status: to as never },
    });
    return res.count === 1;
  }

  private async stepConfirmBurn(s: StablecoinSpend): Promise<StablecoinSpend> {
    if (!s.burnHash) return this.set(s.id, { status: 'MANUAL_REVIEW', failureReason: 'missing burn hash' });
    const onChain = await this.chain.getTransaction({ transactionHash: s.burnHash });
    if (onChain.status === 'confirmed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: s.burnHash, type: 'ASSET_BURNED' },
        data: { status: 'CONFIRMED', confirmedAt: new Date(), failureReason: null, failureCode: null },
      });
      await this.refreshBalances(s.tenantId, s.walletId); // keep the cache current post-burn
      await this.pointsLots.consume(s.tenantId, s.walletId, s.assetId, s.amount); // draw down the lot ledger
      return this.set(s.id, { status: 'BURN_CONFIRMED' }); // now counted as supply reduction
    }
    if (onChain.status === 'failed') {
      await this.prisma.transaction.updateMany({
        where: { blockchainHash: s.burnHash, type: 'ASSET_BURNED' },
        data: { status: 'FAILED', failureReason: 'spend burn failed', failureCode: 'CHAIN_FAILED' },
      });
      return this.set(s.id, { status: 'FAILED', failureReason: 'spend burn failed' });
    }
    return s; // pending → stay BURN_PENDING, do not re-burn
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

  private async load(tenantId: string, id: string): Promise<StablecoinSpend> {
    const s = await this.prisma.stablecoinSpend.findUnique({ where: { id } });
    if (!s || s.tenantId !== tenantId) throw new NotFoundException('Spend not found');
    return s;
  }

  private async set(id: string, data: Record<string, unknown>): Promise<StablecoinSpend> {
    return this.prisma.stablecoinSpend.update({ where: { id }, data });
  }
}
