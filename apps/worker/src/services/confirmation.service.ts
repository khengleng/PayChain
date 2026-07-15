import type { BlockchainProvider } from '@paychain/blockchain';

/** Minimal Prisma surface this service needs (keeps it unit-testable). */
export interface ConfirmationPrisma {
  transaction: {
    findMany(args: unknown): Promise<
      Array<{ id: string; blockchainHash: string | null }>
    >;
    update(args: unknown): Promise<unknown>;
  };
}

export interface ConfirmationResult {
  scanned: number;
  confirmed: number;
  failed: number;
}

/**
 * Confirmation listener (§17, §40, §47). Submission is never treated as confirmation:
 * transactions land in PENDING_CONFIRMATION, and this job asks the chain for the real
 * status and advances them to CONFIRMED/FAILED. Anything still unknown is left for the
 * next run (idempotent, safe to re-run).
 */
export class ConfirmationService {
  constructor(
    private readonly prisma: ConfirmationPrisma,
    private readonly chain: BlockchainProvider,
  ) {}

  async processPending(limit = 50): Promise<ConfirmationResult> {
    const pending = await this.prisma.transaction.findMany({
      where: { status: 'PENDING_CONFIRMATION', blockchainHash: { not: null } },
      take: limit,
    });

    let confirmed = 0;
    let failed = 0;
    for (const tx of pending) {
      if (!tx.blockchainHash) continue;
      const chainTx = await this.chain.getTransaction({ transactionHash: tx.blockchainHash });
      if (chainTx.status === 'confirmed') {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
        });
        confirmed += 1;
      } else if (chainTx.status === 'failed') {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: { status: 'FAILED', failureReason: 'chain reported failure', failureCode: 'CHAIN_FAILED' },
        });
        failed += 1;
      }
      // 'pending' / 'not_found' → leave in PENDING_CONFIRMATION for a later run.
    }
    return { scanned: pending.length, confirmed, failed };
  }
}
