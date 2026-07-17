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
  wallet: {
    findMany(args: unknown): Promise<
      Array<{ id: string; tenantId: string; stellarAccountId: string }>
    >;
  };
  balanceReadModel: {
    findMany(args: unknown): Promise<
      Array<{ walletId: string; assetCode: string; issuerPublicKey: string; balance: string }>
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

export interface BalanceReconciliationResult {
  scanned: number;
  drifted: number;
  unreconciled: number;
}

export interface OrphanReconciliationResult {
  scanned: number;
  orphans: number;
  unreconciled: number;
}

/**
 * Amount equality that does not depend on formatting. The chain returns "1000.0000000" where we
 * may store "1000"; a string compare would report drift on every balance and bury a real one in
 * noise. Compared as fixed-point decimals via BigInt — never parseFloat, which is the arithmetic
 * this codebase exists to avoid on money.
 */
export function sameAmount(a: string, b: string): boolean {
  const scale = (v: string): bigint => {
    const [whole = '0', frac = ''] = v.trim().split('.');
    return BigInt(whole + (frac + '0000000').slice(0, 7));
  };
  try {
    return scale(a) === scale(b);
  } catch {
    return a.trim() === b.trim();
  }
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
 * - run() scans the most recent `limit` transactions THAT CARRY A HASH. Records without one are
 *   never examined, and older records fall out of the window entirely.
 * - reconcileBalances() and findOrphanTransactions() sample recent wallets, not the whole estate.
 *   Sampling is honest for a scheduled job; a full sweep is a separate, slower control.
 * - SUPPLY_MISMATCH, DUPLICATE_TRANSACTION, UNAUTHORIZED_MOVEMENT, RESERVE_SHORTFALL, MISSING_MINT
 *   and UNMATCHED_BURN remain declared but unproduced.
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

  /**
   * Balance drift (§31): does the balance we serve match what the chain actually holds?
   *
   * BalanceReadModel is a cache rebuilt from the chain, and a cache that silently diverges from
   * its source is worse than no cache — it is a wrong number presented with confidence. This is
   * the check that answers "are the balances you show customers real?", which is not something
   * the transaction-by-transaction check can establish: every individual transaction can
   * corroborate while the aggregate is still wrong.
   *
   * The chain is authoritative. A mismatch is always OUR error, never the chain's, so the drift
   * is recorded against our record — and never silently repaired, because a cache that heals
   * itself destroys the evidence of why it drifted.
   */
  async reconcileBalances(limit = 100): Promise<BalanceReconciliationResult> {
    const wallets = await this.prisma.wallet.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    let drifted = 0;
    let unreconciled = 0;

    for (const wallet of wallets) {
      try {
        const [onChain, recorded] = await Promise.all([
          this.chain.getBalance({ publicKey: wallet.stellarAccountId }),
          this.prisma.balanceReadModel.findMany({ where: { walletId: wallet.id } }),
        ]);

        // Key on (assetCode, issuer): the same code from two issuers is two different assets, and
        // collapsing them would hide a drift by netting it against an unrelated balance.
        const chainByKey = new Map(onChain.map((b) => [`${b.assetCode}|${b.issuerPublicKey ?? ''}`, b.balance]));
        const dbByKey = new Map(recorded.map((b) => [`${b.assetCode}|${b.issuerPublicKey}`, b.balance]));

        for (const [key, dbBalance] of dbByKey) {
          const chainBalance = chainByKey.get(key);
          // Absent on-chain means zero, not "skip": a balance we record for an asset the wallet
          // does not hold is exactly the drift worth catching.
          if (!sameAmount(chainBalance ?? '0', dbBalance)) {
            const opened = await this.recordBalanceException(wallet, {
              assetKey: key,
              recordedBalance: dbBalance,
              chainBalance: chainBalance ?? '0',
              note: 'Balance read-model disagrees with the chain. The chain is authoritative.',
            });
            if (opened) drifted += 1;
          }
        }
      } catch (err) {
        unreconciled += 1;
        await this.recordBalanceException(wallet, {
          chainBalance: 'unqueryable',
          error: err instanceof Error ? err.message : String(err),
          note: 'Chain balance lookup failed — this wallet could not be reconciled.',
        });
      }
    }
    return { scanned: wallets.length, drifted, unreconciled };
  }

  /**
   * Orphan chain transactions (§31): the direction that was never asked.
   *
   * run() only checks "we say confirmed — does the chain agree?". The reverse — a transaction on
   * an account we control that PayChain has NO record of — was invisible, and it is the more
   * alarming of the two: it means value moved without the platform knowing, which is what a
   * stolen key or an out-of-band signer looks like. A custody platform that cannot see that is
   * not reconciling, it is confirming its own bookkeeping.
   */
  async findOrphanTransactions(walletLimit = 50, historyLimit = 20): Promise<OrphanReconciliationResult> {
    const wallets = await this.prisma.wallet.findMany({
      take: walletLimit,
      orderBy: { createdAt: 'desc' },
    });

    let orphans = 0;
    let unreconciled = 0;

    for (const wallet of wallets) {
      try {
        const history = await this.chain.getTransactionHistory({
          publicKey: wallet.stellarAccountId,
          limit: historyLimit,
        });
        if (history.length === 0) continue;

        const hashes = history.map((h) => h.transactionHash);
        const known = await this.prisma.transaction.findMany({
          where: { blockchainHash: { in: hashes } },
        });
        const knownHashes = new Set(known.map((k) => k.blockchainHash));

        for (const chainTx of history) {
          if (knownHashes.has(chainTx.transactionHash)) continue;
          const opened = await this.recordOrphanException(wallet, chainTx.transactionHash, {
            stellarAccountId: wallet.stellarAccountId,
            ledger: chainTx.ledger,
            createdAt: chainTx.createdAt,
            note:
              'A transaction exists on-chain for an account we control that PayChain has no ' +
              'record of. Value may have moved outside the platform.',
          });
          if (opened) orphans += 1;
        }
      } catch (err) {
        unreconciled += 1;
      }
    }
    return { scanned: wallets.length, orphans, unreconciled };
  }

  private async recordBalanceException(
    wallet: { id: string; tenantId: string; stellarAccountId: string },
    detail: Record<string, unknown>,
  ): Promise<boolean> {
    return this.recordException(
      { id: wallet.id, tenantId: wallet.tenantId, blockchainHash: null, correlationId: `recon-balance-${wallet.id}` },
      'BALANCE_DRIFT',
      detail,
    );
  }

  private async recordOrphanException(
    wallet: { id: string; tenantId: string },
    hash: string,
    detail: Record<string, unknown>,
  ): Promise<boolean> {
    const existing = await this.prisma.reconciliationException.findFirst({
      where: { blockchainHash: hash, category: 'ORPHAN_BLOCKCHAIN_TRANSACTION', status: 'OPEN' },
    });
    if (existing) return false;
    await this.prisma.reconciliationException.create({
      data: {
        tenantId: wallet.tenantId,
        category: 'ORPHAN_BLOCKCHAIN_TRANSACTION',
        // No transactionId: the whole point is that we have no transaction for it.
        blockchainHash: hash,
        detail,
        correlationId: `recon-orphan-${wallet.id}`,
      },
    });
    return true;
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
