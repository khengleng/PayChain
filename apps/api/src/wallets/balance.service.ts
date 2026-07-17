import { Inject, Injectable } from '@nestjs/common';
import type { BlockchainProvider } from '@paychain/blockchain';
import { BLOCKCHAIN_PROVIDER } from '../blockchain/blockchain.module';
import { PrismaService } from '../prisma/prisma.service';

export interface BalanceView {
  assetCode: string;
  /** Empty string for the native/no-issuer asset (XLM). */
  issuerPublicKey: string;
  balance: string;
  updatedAt: Date;
}

/**
 * Maintains the rebuildable balance read model (§16, §32). The chain is authoritative;
 * this table is a cache that can always be reconstructed via refreshFromChain (the basis
 * of `rebuild:wallet-balances`, in packages/database/scripts). It must never become the hidden
 * source of truth (§47) — which is exactly what a cache with no rebuild path is, whatever the
 * comment says.
 */
@Injectable()
export class BalanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BLOCKCHAIN_PROVIDER) private readonly chain: BlockchainProvider,
  ) {}

  /** Pull authoritative balances from chain and upsert the read model for a wallet. */
  async refreshFromChain(params: {
    tenantId: string;
    walletId: string;
    stellarAccountId: string;
  }): Promise<void> {
    const balances = await this.chain.getBalance({ publicKey: params.stellarAccountId });
    for (const b of balances) {
      const issuerPublicKey = b.issuerPublicKey ?? '';
      await this.prisma.balanceReadModel.upsert({
        where: {
          walletId_assetCode_issuerPublicKey: {
            walletId: params.walletId,
            assetCode: b.assetCode,
            issuerPublicKey,
          },
        },
        create: {
          tenantId: params.tenantId,
          walletId: params.walletId,
          assetCode: b.assetCode,
          issuerPublicKey,
          balance: b.balance,
        },
        update: { balance: b.balance },
      });
    }
  }

  async list(tenantId: string, walletId: string): Promise<BalanceView[]> {
    const rows = await this.prisma.balanceReadModel.findMany({
      where: { tenantId, walletId },
      orderBy: { assetCode: 'asc' },
    });
    return rows.map((r) => ({
      assetCode: r.assetCode,
      issuerPublicKey: r.issuerPublicKey,
      balance: r.balance,
      updatedAt: r.updatedAt,
    }));
  }
}
