import type { LedgerEntry } from './dual-run';
import type { WebhookDispatch } from './webhook-handler';
import type { EarnResult, PayKhPayChainAdapter } from './adapter';

export interface PaymentSuccessEvent {
  paymentId: string;
  customerId: string;
  spendAmount: string;
  currency: string;
  merchantId?: string;
  paidAtIso?: string;
}

export type RewardSyncStatus =
  /** Earn submitted (or attempted) but PayChain has not yet returned a transaction. */
  | 'REWARD_REQUESTED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  /** PayChain cannot match its ledger to the chain, or reported a status this build doesn't know. */
  | 'NEEDS_RECONCILIATION'
  | 'NO_REWARD';

/**
 * PayChain's TransactionStatus enum (packages/database/prisma/schema.prisma). Mirrored here because
 * the example doesn't depend on the database package — keep it in step with the schema.
 */
export type PayChainTransactionStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'REJECTED'
  | 'QUEUED'
  | 'SIGNING'
  | 'SUBMITTED'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'FAILED'
  | 'EXPIRED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'REVERSED_BY_COMPENSATION'
  | 'RECONCILIATION_REQUIRED';

/**
 * Every PayChain status mapped to a reward outcome. Written as a total Record so adding a status to
 * the schema without deciding its reward meaning is a compile error rather than a reward that sits
 * pending forever — the failure mode this table was introduced to fix.
 */
const SYNC_STATUS_BY_TRANSACTION_STATUS: Record<PayChainTransactionStatus, RewardSyncStatus> = {
  RECEIVED: 'PENDING_CONFIRMATION',
  VALIDATING: 'PENDING_CONFIRMATION',
  QUEUED: 'PENDING_CONFIRMATION',
  SIGNING: 'PENDING_CONFIRMATION',
  SUBMITTED: 'PENDING_CONFIRMATION',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  // Awaiting a human maker-checker. Genuinely pending, but it can rest here indefinitely — alert on
  // age rather than waiting for it to resolve on its own.
  APPROVAL_REQUIRED: 'PENDING_CONFIRMATION',
  APPROVED: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  // Terminal failures. REVERSED_BY_COMPENSATION means the award was undone after the fact, so the
  // points must come back off PayKH's side too — never leave it looking pending.
  REJECTED: 'FAILED',
  FAILED: 'FAILED',
  EXPIRED: 'FAILED',
  REVERSED_BY_COMPENSATION: 'FAILED',
  // PayChain's ledger and the chain disagree. Not a failure and not a success: a human decides.
  RECONCILIATION_REQUIRED: 'NEEDS_RECONCILIATION',
};

export interface PaymentRewardRecord {
  paymentId: string;
  customerId: string;
  walletId: string;
  spendAmount: string;
  currency: string;
  merchantId?: string;
  points: string;
  appliedRules: string[];
  transactionId: string | null;
  transactionStatus: string | null;
  syncStatus: RewardSyncStatus;
  paychainReference: string;
  lastDeliveryId?: string;
  paidAtIso?: string;
  requestedAtIso: string;
  confirmedAtIso?: string;
  failureReason?: string;
}

export interface PaymentRewardStateStore {
  getByPaymentId(paymentId: string): Promise<PaymentRewardRecord | null> | PaymentRewardRecord | null;
  getByTransactionId(transactionId: string): Promise<PaymentRewardRecord | null> | PaymentRewardRecord | null;
  save(record: PaymentRewardRecord): Promise<void> | void;
  hasProcessedDelivery(deliveryId: string): Promise<boolean> | boolean;
  markDeliveryProcessed(deliveryId: string): Promise<void> | void;
  listPendingConfirmation(): Promise<PaymentRewardRecord[]> | PaymentRewardRecord[];
  listAll(): Promise<PaymentRewardRecord[]> | PaymentRewardRecord[];
}

export class InMemoryPaymentRewardStateStore implements PaymentRewardStateStore {
  private readonly byPaymentId = new Map<string, PaymentRewardRecord>();
  private readonly paymentIdByTransactionId = new Map<string, string>();
  private readonly processedDeliveries = new Set<string>();

  getByPaymentId(paymentId: string): PaymentRewardRecord | null {
    return this.byPaymentId.get(paymentId) ?? null;
  }

  getByTransactionId(transactionId: string): PaymentRewardRecord | null {
    const paymentId = this.paymentIdByTransactionId.get(transactionId);
    return paymentId ? this.byPaymentId.get(paymentId) ?? null : null;
  }

  save(record: PaymentRewardRecord): void {
    this.byPaymentId.set(record.paymentId, record);
    if (record.transactionId) this.paymentIdByTransactionId.set(record.transactionId, record.paymentId);
  }

  hasProcessedDelivery(deliveryId: string): boolean {
    return this.processedDeliveries.has(deliveryId);
  }

  markDeliveryProcessed(deliveryId: string): void {
    this.processedDeliveries.add(deliveryId);
  }

  listPendingConfirmation(): PaymentRewardRecord[] {
    return [...this.byPaymentId.values()].filter(
      (r) => r.syncStatus === 'REWARD_REQUESTED' || r.syncStatus === 'PENDING_CONFIRMATION',
    );
  }

  listAll(): PaymentRewardRecord[] {
    return [...this.byPaymentId.values()];
  }
}

export interface PaymentRewardOrchestratorResult {
  record: PaymentRewardRecord;
  created: boolean;
}

export interface ReconciliationSweepResult {
  scanned: number;
  /** Earns re-submitted under their original idempotency key because no transaction was recorded. */
  replayed: number;
  confirmed: number;
  failed: number;
  /** PayChain needs a human to reconcile these, or reported a status this build doesn't know. */
  needsReconciliation: number;
  stillPending: number;
  noReward: number;
}

interface WebhookPayloadLike extends Record<string, unknown> {
  transactionId?: unknown;
  status?: unknown;
}

/**
 * Bridges PayKH's payment-settled event into PayChain's loyalty earn API, then keeps a local
 * "requested vs confirmed" record so PayKH never mistakes submission for finality.
 */
export class PayKhPaymentRewardOrchestrator {
  constructor(
    private readonly adapter: PayKhPayChainAdapter,
    private readonly store: PaymentRewardStateStore,
  ) {}

  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<PaymentRewardOrchestratorResult> {
    const existing = await this.store.getByPaymentId(event.paymentId);
    if (existing) return { record: existing, created: false };

    const wallet = await this.adapter.ensureCustomerWallet(event.customerId);

    // Persist BEFORE calling earn. If the call times out or the process dies mid-flight, PayChain
    // may still have awarded the points — so PayKH must hold a record it can replay, not silently
    // lose the payment. The record starts REWARD_REQUESTED: submitted, nothing confirmed.
    const requested: PaymentRewardRecord = {
      paymentId: event.paymentId,
      customerId: event.customerId,
      walletId: wallet.id,
      spendAmount: event.spendAmount,
      currency: event.currency,
      merchantId: event.merchantId,
      points: '0',
      appliedRules: [],
      transactionId: null,
      transactionStatus: null,
      syncStatus: 'REWARD_REQUESTED',
      paychainReference: paymentReference(event.paymentId),
      paidAtIso: event.paidAtIso,
      requestedAtIso: new Date().toISOString(),
    };
    await this.store.save(requested);

    return { record: await this.submitEarn(requested), created: true };
  }

  /**
   * Calls earn for a stored record and folds the result back in. On failure the record stays
   * REWARD_REQUESTED (not FAILED) — the award may have landed server-side, so the sweep has to
   * replay it under the same key rather than PayKH concluding nothing happened.
   */
  private async submitEarn(record: PaymentRewardRecord): Promise<PaymentRewardRecord> {
    try {
      const reward = await this.adapter.awardPurchaseReward({
        eventId: record.paymentId,
        walletId: record.walletId,
        spendAmount: record.spendAmount,
        currency: record.currency,
        merchantId: record.merchantId,
      });
      const settled = applyEarnResult(record, reward);
      await this.store.save(settled);
      return settled;
    } catch (err) {
      await this.store.save({
        ...record,
        syncStatus: 'REWARD_REQUESTED',
        failureReason: err instanceof Error ? err.message : 'earn call failed',
      });
      throw err;
    }
  }

  buildWebhookDispatch(): WebhookDispatch {
    return {
      'asset.issued': async (payload, meta) => {
        if (meta.deliveryId && (await this.store.hasProcessedDelivery(meta.deliveryId))) return;
        const matched = await this.findRecordForWebhook(payload);
        if (!matched) {
          if (meta.deliveryId) await this.store.markDeliveryProcessed(meta.deliveryId);
          return;
        }
        // asset.issued does NOT mean confirmed: PayChain emits it when the transaction is recorded,
        // with status CONFIRMED or PENDING_CONFIRMATION depending on whether the chain had already
        // confirmed. Classify the carried status instead of assuming the event implies finality.
        const status = asString((payload as WebhookPayloadLike).status) ?? null;
        const syncStatus = classifyTransactionStatus(status);
        const next: PaymentRewardRecord = {
          ...matched,
          transactionStatus: status ?? matched.transactionStatus,
          syncStatus,
          confirmedAtIso: syncStatus === 'CONFIRMED' ? new Date().toISOString() : matched.confirmedAtIso,
          failureReason:
            syncStatus === 'FAILED' || syncStatus === 'NEEDS_RECONCILIATION'
              ? `PayChain transaction ${status ?? 'unknown'}`
              : matched.failureReason,
          lastDeliveryId: meta.deliveryId,
        };
        await this.store.save(next);
        if (meta.deliveryId) await this.store.markDeliveryProcessed(meta.deliveryId);
      },
    };
  }

  async reconcilePendingRewards(): Promise<ReconciliationSweepResult> {
    const pending = await this.store.listPendingConfirmation();
    const sweep: ReconciliationSweepResult = {
      scanned: pending.length,
      replayed: 0,
      confirmed: 0,
      failed: 0,
      needsReconciliation: 0,
      stillPending: 0,
      noReward: 0,
    };

    for (const record of pending) {
      let current = record;

      // No transaction id means the earn call never returned one. Replay it under the SAME
      // idempotency key (`paykh:earn:{paymentId}`): PayChain returns the original award instead of
      // minting a second time, so this recovers a timed-out earn without risking a double-award.
      if (!current.transactionId) {
        try {
          current = await this.submitEarn(current);
          sweep.replayed += 1;
        } catch {
          // Still unreachable — leave it REWARD_REQUESTED for the next sweep.
          sweep.stillPending += 1;
          continue;
        }
      }

      if (current.transactionId) {
        const tx = await this.adapter.getTransactionStatus(current.transactionId);
        const nextStatus = classifyTransactionStatus(tx.status);
        current = {
          ...current,
          transactionStatus: tx.status,
          syncStatus: nextStatus,
          confirmedAtIso: nextStatus === 'CONFIRMED' ? new Date().toISOString() : current.confirmedAtIso,
          failureReason:
            nextStatus === 'FAILED' || nextStatus === 'NEEDS_RECONCILIATION'
              ? `PayChain transaction ${tx.status}`
              : current.failureReason,
        };
        await this.store.save(current);
      }

      tally(sweep, current.syncStatus);
    }

    return sweep;
  }

  async listConfirmedLedgerEntries(): Promise<LedgerEntry[]> {
    const rows = await this.store.listAll();
    const confirmed = rows.filter((r) => r.syncStatus === 'CONFIRMED');
    return confirmed.map((r) => ({
      reference: r.paychainReference,
      points: Number(r.points),
    }));
  }

  /**
   * PayChain's asset.issued payload is {transactionId, type, status, assetId, amount,
   * blockchainHash} — it carries no business reference or idempotency key, so transactionId is the
   * only join available. A webhook for an earn whose transaction id PayKH never stored (the
   * timed-out case) simply won't match here; reconcilePendingRewards recovers it by replay.
   */
  private async findRecordForWebhook(payload: Record<string, unknown>): Promise<PaymentRewardRecord | null> {
    const transactionId = asString((payload as WebhookPayloadLike).transactionId);
    return transactionId ? this.store.getByTransactionId(transactionId) : null;
  }
}

function applyEarnResult(record: PaymentRewardRecord, reward: EarnResult): PaymentRewardRecord {
  const syncStatus: RewardSyncStatus =
    reward.points === '0' || !reward.transaction
      ? 'NO_REWARD'
      : classifyTransactionStatus(reward.transaction.status);

  return {
    ...record,
    points: reward.points,
    appliedRules: reward.appliedRules,
    transactionId: reward.transaction?.id ?? null,
    transactionStatus: reward.transaction?.status ?? null,
    syncStatus,
    confirmedAtIso: syncStatus === 'CONFIRMED' ? new Date().toISOString() : record.confirmedAtIso,
    failureReason: undefined,
  };
}

function tally(sweep: ReconciliationSweepResult, status: RewardSyncStatus): void {
  if (status === 'CONFIRMED') sweep.confirmed += 1;
  else if (status === 'FAILED') sweep.failed += 1;
  else if (status === 'NEEDS_RECONCILIATION') sweep.needsReconciliation += 1;
  else if (status === 'NO_REWARD') sweep.noReward += 1;
  else sweep.stillPending += 1;
}

export function paymentReference(paymentId: string): string {
  return `payment:${paymentId}`;
}

export function recordToLedgerEntry(record: PaymentRewardRecord): LedgerEntry {
  return {
    reference: record.paychainReference,
    points: Number(record.points),
  };
}

export function classifyTransactionStatus(status: string | null): RewardSyncStatus {
  if (!status) return 'PENDING_CONFIRMATION';
  // An unrecognised status means PayChain moved ahead of this build. Escalate rather than assume
  // it is transient — assuming pending is how a terminal state goes unnoticed.
  return SYNC_STATUS_BY_TRANSACTION_STATUS[status as PayChainTransactionStatus] ?? 'NEEDS_RECONCILIATION';
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
