import type { BlockchainProvider } from '@paychain/blockchain';
import type { SymmetricCrypto } from '@paychain/security';

export interface ExpiryLot {
  id: string;
  tenantId: string;
  walletId: string;
  assetId: string;
  remaining: string;
  asset: { assetCode: string; issuerPublicKey: string };
}

export interface ExpiryPrisma {
  pointsLot: {
    findMany(args: unknown): Promise<ExpiryLot[]>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  wallet: {
    findUnique(args: unknown): Promise<{ id: string; stellarAccountId: string; stellarSecretEnc: string | null } | null>;
  };
  transaction: { create(args: unknown): Promise<unknown> };
  auditLog: { create(args: unknown): Promise<unknown> };
}

export interface ExpiryResult {
  scanned: number;
  expired: number;
  burned: number;
}

/**
 * Off-chain expiry engine (§21). Stellar assets never expire on-chain, so this job finds
 * points lots past their expiry and burns the still-held remaining amount from the holder,
 * then records an ASSET_EXPIRED transaction and audit entry. It burns only what the wallet
 * actually still holds (min of lot remaining and on-chain balance), so it can never
 * over-burn if the customer already spent/transferred the points.
 */
export class ExpiryService {
  constructor(
    private readonly prisma: ExpiryPrisma,
    private readonly chain: BlockchainProvider,
    private readonly crypto: SymmetricCrypto,
  ) {}

  async processExpired(now: Date, limit = 100): Promise<ExpiryResult> {
    const due = await this.prisma.pointsLot.findMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now, not: null } },
      take: limit,
      include: { asset: true },
    });

    let expired = 0;
    let burned = 0;
    for (const lot of due) {
      // Claim the lot atomically (ACTIVE → EXPIRED) BEFORE burning, so a concurrent run or a
      // re-run after a crash cannot burn the same lot twice. If another run already claimed
      // it, skip. (A burn that later fails on-chain is caught by reconciliation.)
      const claim = await this.prisma.pointsLot.updateMany({
        where: { id: lot.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED', remaining: '0' },
      });
      if (claim.count !== 1) continue;
      expired += 1;

      const wallet = await this.prisma.wallet.findUnique({ where: { id: lot.walletId } });
      if (wallet?.stellarSecretEnc) {
        const balances = await this.chain.getBalance({ publicKey: wallet.stellarAccountId });
        const held = balances.find(
          (b) => b.assetCode === lot.asset.assetCode && b.issuerPublicKey === lot.asset.issuerPublicKey,
        );
        const burnable = Math.min(Number(lot.remaining), held ? Number(held.balance) : 0);
        if (burnable > 0) {
          const secret = this.crypto.decrypt(wallet.stellarSecretEnc);
          const res = await this.chain.burnAsset({
            correlationId: `expiry-${lot.id}`,
            assetCode: lot.asset.assetCode,
            issuerPublicKey: lot.asset.issuerPublicKey,
            holderPublicKey: wallet.stellarAccountId,
            holderSecretKey: secret,
            amount: String(burnable),
          });
          await this.prisma.transaction.create({
            data: {
              tenantId: lot.tenantId,
              type: 'ASSET_EXPIRED',
              status: 'PENDING_CONFIRMATION',
              assetId: lot.assetId,
              amount: String(burnable),
              sourceWalletId: lot.walletId,
              blockchainHash: res.transactionHash,
              businessReason: 'expiry',
              correlationId: `expiry-${lot.id}`,
              submittedAt: new Date(),
            },
          });
          burned += 1;
        }
      }

      // Lot already marked EXPIRED/remaining=0 by the claim above.
      await this.prisma.auditLog.create({
        data: {
          tenantId: lot.tenantId,
          actor: 'worker:expiry',
          action: 'loyalty.expiry.processed',
          resourceType: 'points_lot',
          resourceId: lot.id,
          metadata: { walletId: lot.walletId, assetId: lot.assetId },
        },
      });
    }
    return { scanned: due.length, expired, burned };
  }
}
