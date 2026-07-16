import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import type { Wallet } from '@paychain/database';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import { assertWalletCanTransact } from './wallet-status';
import { BalanceService } from './balance.service';
import type { CreateWalletDto } from './dto';

export interface WalletView {
  id: string;
  ownerType: string;
  ownerReference: string;
  stellarAccountId: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
    private readonly balances: BalanceService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  /**
   * Creates a custodial Stellar account for a wallet (§10). The account is funded via friendbot,
   * which is testnet-only — there is no mainnet funding path until reserve/fee sponsorship
   * (begin/end-sponsoring, §10) lands, which is the documented M1 follow-up. Customers never
   * hold or purchase XLM either way. Do not describe these as "sponsored" wallets until that
   * work exists; the sponsorship config (STELLAR_SPONSOR_*) is currently unread.
   */
  async create(auth: AuthContext, dto: CreateWalletDto, correlationId: string): Promise<WalletView> {
    const created = await this.chain.createWallet({ correlationId });
    const wallet = await this.prisma.wallet.create({
      data: {
        tenantId: auth.tenantId,
        ownerType: dto.ownerType,
        ownerReference: dto.ownerReference,
        stellarAccountId: created.publicKey,
        stellarSecretEnc: created.secretKey ? this.crypto.encrypt(created.secretKey) : null,
        status: created.funded ? 'ACTIVE' : 'PENDING',
        createdBy: auth.clientId,
        lastActivityAt: new Date(),
      },
    });

    await this.prisma.transaction.create({
      data: {
        tenantId: auth.tenantId,
        type: 'WALLET_CREATED',
        status: created.funded ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        correlationId,
        sourceWalletId: wallet.id,
      },
    });

    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'wallet.create',
      resourceType: 'wallet',
      resourceId: wallet.id,
      correlationId,
      metadata: { stellarAccountId: wallet.stellarAccountId, funded: created.funded },
    });

    return this.toView(wallet);
  }

  /** Loads a wallet, enforcing tenant ownership (§7). Never trusts a client tenant id. */
  async getOwned(tenantId: string, walletId: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (wallet.tenantId !== tenantId) {
      // Cross-tenant access is a not-found from the caller's perspective (§7).
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async get(auth: AuthContext, walletId: string): Promise<WalletView> {
    return this.toView(await this.getOwned(auth.tenantId, walletId));
  }

  async listBalances(auth: AuthContext, walletId: string): Promise<
    { assetCode: string; issuerPublicKey: string; balance: string; updatedAt: Date }[]
  > {
    const wallet = await this.getOwned(auth.tenantId, walletId);
    // Refresh the read model from the authoritative chain, then serve it (§16, §32).
    await this.balances.refreshFromChain({
      tenantId: auth.tenantId,
      walletId: wallet.id,
      stellarAccountId: wallet.stellarAccountId,
    });
    return this.balances.list(auth.tenantId, wallet.id);
  }

  /**
   * Returns the decrypted signing secret for an owned wallet. Internal use only (§41).
   *
   * This is also where a wallet's status is enforced, and deliberately so: every money-moving
   * path (issue, transfer, redeem, burn, expiry) must obtain a signing key, so a control placed
   * here cannot be forgotten by a future caller. Previously `status` was written by freeze and
   * read by nothing — a FROZEN wallet transferred its full balance, and both the routine freeze
   * and the emergency break-glass freeze were equally cosmetic.
   *
   * Reads are intentionally unaffected: a frozen customer can still see their balance and
   * history. Freezing stops value moving; it is not a gag.
   */
  async requireSecret(tenantId: string, walletId: string): Promise<{ wallet: Wallet; secret: string }> {
    const wallet = await this.getOwned(tenantId, walletId);
    assertWalletCanTransact(wallet);
    if (!wallet.stellarSecretEnc) {
      throw new ForbiddenException('Wallet has no managed signing key');
    }
    return { wallet, secret: this.crypto.decrypt(wallet.stellarSecretEnc) };
  }

  private toView(w: Wallet): WalletView {
    return {
      id: w.id,
      ownerType: w.ownerType,
      ownerReference: w.ownerReference,
      stellarAccountId: w.stellarAccountId,
      status: w.status,
      createdAt: w.createdAt,
    };
  }
}
