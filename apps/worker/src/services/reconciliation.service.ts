import type { BlockchainProvider } from '@paychain/blockchain';

export interface ReconciliationPrisma {
  transaction: {
    findMany(args: unknown): Promise<
      Array<{
        id: string;
        tenantId: string;
        status: string;
        blockchainHash: string | null;
        correlationId: string;
      }>
    >;
  };
  reconciliationException: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<unknown>;
  };
}

export interface ReconciliationResult {
  scanned: number;
  exceptions: number;
}

/**
 * Independent reconciliation (§31, §47). Compares PayChain transaction records against the
 * authoritative chain and records discrepancies in the exception queue. It NEVER mutates
 * or conceals a mismatch — it only opens an exception for an operator to resolve, and it
 * does not open a duplicate exception for an already-open (tx, category) pair.
 */
export class ReconciliationService {
  constructor(
    private readonly prisma: ReconciliationPrisma,
    private readonly chain: BlockchainProvider,
  ) {}

  async run(limit = 100): Promise<ReconciliationResult> {
    const txns = await this.prisma.transaction.findMany({
      where: { blockchainHash: { not: null } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let exceptions = 0;
    for (const tx of txns) {
      if (!tx.blockchainHash) continue;
      const chainTx = await this.chain.getTransaction({ transactionHash: tx.blockchainHash });

      // We believe it is confirmed, but the chain does not corroborate → discrepancy.
      if (tx.status === 'CONFIRMED' && chainTx.status !== 'confirmed') {
        const opened = await this.recordException(tx, 'MISSING_CONFIRMATION', {
          recordStatus: tx.status,
          chainStatus: chainTx.status,
        });
        if (opened) exceptions += 1;
      }
    }
    return { scanned: txns.length, exceptions };
  }

  private async recordException(
    tx: { id: string; tenantId: string; blockchainHash: string | null; correlationId: string },
    category: string,
    detail: Record<string, unknown>,
  ): Promise<boolean> {
    const existing = await this.prisma.reconciliationException.findFirst({
      where: { transactionId: tx.id, category, status: 'OPEN' },
    });
    if (existing) return false; // never duplicate an open exception
    await this.prisma.reconciliationException.create({
      data: {
        tenantId: tx.tenantId,
        category,
        transactionId: tx.id,
        blockchainHash: tx.blockchainHash,
        detail,
        correlationId: tx.correlationId,
      },
    });
    return true;
  }
}
