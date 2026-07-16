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
  /** Records whose chain lookup failed, so they could not be verified either way. */
  unreconciled: number;
}

/**
 * Independent reconciliation (§31, §47). Compares PayChain transaction records against the
 * authoritative chain and records discrepancies in the exception queue. It NEVER mutates
 * or conceals a mismatch — it only opens an exception for an operator to resolve, and it
 * does not open a duplicate exception for an already-open (tx, category) pair.
 *
 * Known limits, stated because the schema implies more than this does:
 * - ReconciliationCategory declares 9 categories; only MISSING_CONFIRMATION is produced.
 *   SUPPLY_MISMATCH, BALANCE_DRIFT, ORPHAN_BLOCKCHAIN_TRANSACTION and the rest are unbuilt.
 * - It checks ONE direction: "we say confirmed — does the chain agree?" The reverse is never
 *   asked, so a chain transaction PayChain has no record of is invisible to this job.
 * - It scans the most recent `limit` transactions THAT CARRY A HASH. Records without one are
 *   never examined, and older records fall out of the window entirely.
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
    let unreconciled = 0;

    for (const tx of txns) {
      if (!tx.blockchainHash) continue;
      try {
        const chainTx = await this.chain.getTransaction({ transactionHash: tx.blockchainHash });

        // We believe it is confirmed, but the chain does not corroborate → discrepancy.
        if (tx.status === 'CONFIRMED' && chainTx.status !== 'confirmed') {
          const opened = await this.recordException(tx, 'MISSING_CONFIRMATION', {
            recordStatus: tx.status,
            chainStatus: chainTx.status,
          });
          if (opened) exceptions += 1;
        }
      } catch (err) {
        // A single unqueryable transaction must not stop the run. Without this, one malformed
        // or unfetchable hash threw out of the loop and aborted reconciliation entirely — every
        // remaining transaction went unchecked, and the only trace was a failed job. A control
        // that one bad row can silently switch off is not a control.
        //
        // The failure is itself recorded: being unable to reconcile a transaction is a finding,
        // not a nuisance. Swallowing it would let a permanently unverifiable record sit in the
        // ledger looking reconciled.
        unreconciled += 1;
        const opened = await this.recordException(tx, 'MISSING_CONFIRMATION', {
          recordStatus: tx.status,
          chainStatus: 'unqueryable',
          error: err instanceof Error ? err.message : String(err),
          note: 'Chain lookup failed — this record could not be reconciled against the chain.',
        });
        if (opened) exceptions += 1;
      }
    }
    return { scanned: txns.length, exceptions, unreconciled };
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
