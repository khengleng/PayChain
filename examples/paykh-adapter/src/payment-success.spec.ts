import { PayKhPayChainAdapter, type PayChainClientLike } from './adapter';
import {
  InMemoryPaymentRewardStateStore,
  PayKhPaymentRewardOrchestrator,
  classifyTransactionStatus,
  paymentReference,
  recordToLedgerEntry,
} from './payment-success';

const cfg = {
  baseUrl: 'https://api.test',
  clientId: 'c',
  clientSecret: 's',
  loyaltyAssetId: 'asset-1',
  loyaltyAssetCode: 'PTS',
};

/**
 * The exact asset.issued payload PayChain emits (apps/api/src/assets/assets.service.ts). No
 * business reference and no idempotency key — transactionId is the only join PayKH gets.
 */
function assetIssuedPayload(status: string): Record<string, unknown> {
  return {
    transactionId: 'tx-pay-1',
    type: 'ASSET_ISSUED',
    status,
    assetId: 'asset-1',
    amount: '100',
    blockchainHash: status === 'CONFIRMED' ? 'H' : null,
  };
}

function mockClient(
  overrides: Partial<{
    earn: jest.Mock;
    create: jest.Mock;
    getTx: jest.Mock;
  }> = {},
): PayChainClientLike {
  return {
    wallets: {
      create: overrides.create ?? jest.fn().mockResolvedValue({ id: 'w1', stellarAccountId: 'G', status: 'ACTIVE' }),
      get: jest.fn(),
      balances: jest.fn().mockResolvedValue([{ assetCode: 'PTS', balance: '150' }]),
    },
    assets: {
      issue: jest.fn(),
      transfer: jest.fn(),
      redeem: jest.fn(),
      earn:
        overrides.earn ??
        jest.fn().mockResolvedValue({
          points: '100',
          appliedRules: ['base'],
          transaction: { id: 'tx-pay-1', status: 'PENDING_CONFIRMATION', blockchainHash: null },
        }),
    },
    transactions: {
      get: overrides.getTx ?? jest.fn().mockResolvedValue({ id: 'tx-pay-1', status: 'CONFIRMED', blockchainHash: 'H' }),
    },
  };
}

function orchestrator(overrides: Parameters<typeof mockClient>[0] = {}) {
  const store = new InMemoryPaymentRewardStateStore();
  const adapter = new PayKhPayChainAdapter(cfg, mockClient(overrides));
  return { store, orchestrator: new PayKhPaymentRewardOrchestrator(adapter, store) };
}

const payment = (paymentId: string) => ({
  paymentId,
  customerId: `cust-${paymentId}`,
  spendAmount: '10',
  currency: 'USD',
});

describe('PayKh payment-success orchestration', () => {
  it('turns one settled payment into one idempotent pending reward record', async () => {
    const earn = jest.fn().mockResolvedValue({
      points: '100',
      appliedRules: ['base'],
      transaction: { id: 'tx-pay-1', status: 'PENDING_CONFIRMATION', blockchainHash: null },
    });
    const { orchestrator: rewards } = orchestrator({ earn });

    const first = await rewards.handlePaymentSuccess({ ...payment('pay-1'), merchantId: 'merchant-1' });
    const second = await rewards.handlePaymentSuccess({ ...payment('pay-1'), merchantId: 'merchant-1' });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(first.record.syncStatus).toBe('PENDING_CONFIRMATION');
    expect(first.record.paychainReference).toBe(paymentReference('pay-1'));
    expect(earn).toHaveBeenCalledTimes(1);
    expect(earn).toHaveBeenCalledWith(
      'asset-1',
      expect.objectContaining({ walletId: 'w1', spendAmount: '10', currency: 'USD' }),
      'paykh:earn:pay-1',
    );
  });

  it('confirms a reward from a webhook and dedupes repeated deliveries', async () => {
    const { store, orchestrator: rewards } = orchestrator();
    await rewards.handlePaymentSuccess(payment('pay-2'));

    const dispatch = rewards.buildWebhookDispatch();
    const meta = { eventType: 'asset.issued', deliveryId: 'delivery-1' };
    await dispatch['asset.issued']?.(assetIssuedPayload('CONFIRMED'), meta);
    await dispatch['asset.issued']?.(assetIssuedPayload('CONFIRMED'), meta);

    const record = await store.getByPaymentId('pay-2');
    expect(record?.syncStatus).toBe('CONFIRMED');
    expect(record?.transactionStatus).toBe('CONFIRMED');
    expect(record?.lastDeliveryId).toBe('delivery-1');
  });

  // asset.issued fires as soon as the transaction is recorded, which happens before the chain has
  // necessarily confirmed. Treating the event itself as finality would confirm an unsettled award.
  it('does not treat an unconfirmed asset.issued as settlement', async () => {
    const { store, orchestrator: rewards } = orchestrator();
    await rewards.handlePaymentSuccess(payment('pay-2b'));

    await rewards.buildWebhookDispatch()['asset.issued']?.(assetIssuedPayload('PENDING_CONFIRMATION'), {
      eventType: 'asset.issued',
      deliveryId: 'delivery-2b',
    });

    const record = await store.getByPaymentId('pay-2b');
    expect(record?.syncStatus).toBe('PENDING_CONFIRMATION');
    expect(record?.confirmedAtIso).toBeUndefined();
  });

  it('reconciles pending rewards by polling transaction status when webhook delivery lags', async () => {
    const getTx = jest.fn().mockResolvedValue({ id: 'tx-pay-1', status: 'CONFIRMED', blockchainHash: 'H' });
    const { store, orchestrator: rewards } = orchestrator({ getTx });
    await rewards.handlePaymentSuccess(payment('pay-3'));

    const result = await rewards.reconcilePendingRewards();
    const record = await store.getByPaymentId('pay-3');

    expect(result).toEqual({
      scanned: 1,
      replayed: 0,
      confirmed: 1,
      failed: 0,
      needsReconciliation: 0,
      stillPending: 0,
      noReward: 0,
    });
    expect(getTx).toHaveBeenCalledWith('tx-pay-1');
    expect(record?.syncStatus).toBe('CONFIRMED');
    expect(recordToLedgerEntry(record!)).toEqual({ reference: 'payment:pay-3', points: 100 });
  });

  /**
   * Recovery for the window PayKH cannot see into: the earn request left, but no response came
   * back. PayChain may or may not have awarded the points, so the record has to survive and the
   * sweep has to replay it under its original key rather than PayKH assuming nothing happened.
   */
  it('persists a timed-out earn and recovers it by idempotent replay', async () => {
    const earn = jest
      .fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValue({
        points: '100',
        appliedRules: ['base'],
        transaction: { id: 'tx-pay-1', status: 'PENDING_CONFIRMATION', blockchainHash: null },
      });
    const { store, orchestrator: rewards } = orchestrator({ earn });

    await expect(rewards.handlePaymentSuccess(payment('pay-4'))).rejects.toThrow('socket hang up');

    const afterTimeout = await store.getByPaymentId('pay-4');
    expect(afterTimeout?.syncStatus).toBe('REWARD_REQUESTED');
    expect(afterTimeout?.transactionId).toBeNull();

    const sweep = await rewards.reconcilePendingRewards();
    expect(sweep).toMatchObject({ scanned: 1, replayed: 1, confirmed: 1 });

    // Replayed under the SAME key, so PayChain dedupes instead of awarding twice.
    expect(earn.mock.calls.map((call) => call[2])).toEqual(['paykh:earn:pay-4', 'paykh:earn:pay-4']);
    expect((await store.getByPaymentId('pay-4'))?.syncStatus).toBe('CONFIRMED');
  });

  it('leaves an earn that is still unreachable pending for the next sweep', async () => {
    const earn = jest.fn().mockRejectedValue(new Error('socket hang up'));
    const { store, orchestrator: rewards } = orchestrator({ earn });

    await expect(rewards.handlePaymentSuccess(payment('pay-5'))).rejects.toThrow();
    const sweep = await rewards.reconcilePendingRewards();

    expect(sweep).toMatchObject({ scanned: 1, replayed: 0, stillPending: 1 });
    expect((await store.getByPaymentId('pay-5'))?.syncStatus).toBe('REWARD_REQUESTED');
  });

  describe('PayChain transaction status vocabulary', () => {
    // These are the real TransactionStatus members (packages/database/prisma/schema.prisma). An
    // earlier build classified invented names ('RECONCILED', 'REVERSED'), so genuinely terminal
    // states were reported as pending forever.
    it.each([
      ['REJECTED', 'FAILED'],
      ['FAILED', 'FAILED'],
      ['EXPIRED', 'FAILED'],
      ['REVERSED_BY_COMPENSATION', 'FAILED'],
      ['CONFIRMED', 'CONFIRMED'],
      ['RECONCILIATION_REQUIRED', 'NEEDS_RECONCILIATION'],
      ['APPROVAL_REQUIRED', 'PENDING_CONFIRMATION'],
      ['SUBMITTED', 'PENDING_CONFIRMATION'],
    ])('maps %s to %s', (status, expected) => {
      expect(classifyTransactionStatus(status)).toBe(expected);
    });

    it('escalates a status it does not recognise instead of calling it pending', () => {
      expect(classifyTransactionStatus('SOME_FUTURE_STATE')).toBe('NEEDS_RECONCILIATION');
    });

    it('reports a reversed award as failed in the sweep, not as pending', async () => {
      const getTx = jest
        .fn()
        .mockResolvedValue({ id: 'tx-pay-1', status: 'REVERSED_BY_COMPENSATION', blockchainHash: 'H' });
      const { store, orchestrator: rewards } = orchestrator({ getTx });
      await rewards.handlePaymentSuccess(payment('pay-6'));

      const sweep = await rewards.reconcilePendingRewards();
      const record = await store.getByPaymentId('pay-6');

      expect(sweep).toMatchObject({ failed: 1, stillPending: 0 });
      expect(record?.syncStatus).toBe('FAILED');
      expect(record?.failureReason).toBe('PayChain transaction REVERSED_BY_COMPENSATION');
    });

    it('surfaces RECONCILIATION_REQUIRED for a human instead of retrying it forever', async () => {
      const getTx = jest
        .fn()
        .mockResolvedValue({ id: 'tx-pay-1', status: 'RECONCILIATION_REQUIRED', blockchainHash: 'H' });
      const { store, orchestrator: rewards } = orchestrator({ getTx });
      await rewards.handlePaymentSuccess(payment('pay-7'));

      const sweep = await rewards.reconcilePendingRewards();

      expect(sweep).toMatchObject({ needsReconciliation: 1, stillPending: 0, confirmed: 0, failed: 0 });
      expect((await store.getByPaymentId('pay-7'))?.syncStatus).toBe('NEEDS_RECONCILIATION');
      // Not re-queued: a later sweep must not keep polling a case awaiting human judgement.
      expect(await rewards.reconcilePendingRewards()).toMatchObject({ scanned: 0 });
    });
  });
});
