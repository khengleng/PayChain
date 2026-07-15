import { PayChainClient } from '@paychain/sdk';

/**
 * Sample PayKH → PayChain adapter (§44). LOYALTY ONLY. This is reference code that shows how
 * the (unchanged) PayKH app would call PayChain through the SDK. Stablecoin capabilities are
 * designed but disabled (see stablecoin-preview.ts) until PayChain readiness gates pass.
 *
 * Every business event carries a DETERMINISTIC idempotency key derived from PayKH's own event
 * id, so retries (network blips, at-least-once queues) never double-award or double-redeem.
 */

/** Structural type the adapter needs — satisfied by the real PayChainClient and by test mocks. */
export interface PayChainClientLike {
  wallets: {
    create(input: { ownerType: string; ownerReference: string }, key?: string): Promise<unknown>;
    get(walletId: string): Promise<unknown>;
    balances(walletId: string): Promise<unknown>;
  };
  assets: {
    issue(assetId: string, input: { destinationWalletId: string; amount: string }, key?: string): Promise<unknown>;
    transfer(assetId: string, input: { sourceWalletId: string; destinationWalletId: string; amount: string }, key?: string): Promise<unknown>;
    redeem(assetId: string, input: { sourceWalletId: string; amount: string }, key?: string): Promise<unknown>;
    earn(assetId: string, input: { walletId: string; spendAmount: string; currency: string; merchantId?: string }, key?: string): Promise<unknown>;
  };
  transactions: { get(id: string): Promise<unknown> };
}

export interface PayKhAdapterConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  /** The PayChain asset id + code representing PayKH loyalty points. */
  loyaltyAssetId: string;
  loyaltyAssetCode: string;
  /** Loyalty-only guardrail: stablecoin features stay OFF until readiness gates pass (§44). */
  features?: { stablecoin?: boolean };
}

interface WalletResult {
  id: string;
  stellarAccountId: string;
  status: string;
}
interface TxResult {
  id: string;
  status: string;
  blockchainHash: string | null;
}
interface EarnResult {
  points: string;
  appliedRules: string[];
  transaction: TxResult | null;
}
interface BalanceView {
  assetCode: string;
  balance: string;
}

export class PayKhIntegrationError extends Error {
  constructor(
    readonly operation: string,
    message: string,
    readonly cause?: unknown,
  ) {
    super(`PayKH:${operation} — ${message}`);
    this.name = 'PayKhIntegrationError';
  }
}

export class PayKhPayChainAdapter {
  private readonly client: PayChainClientLike;

  constructor(private readonly cfg: PayKhAdapterConfig, client?: PayChainClientLike) {
    this.client =
      client ??
      new PayChainClient({ baseUrl: cfg.baseUrl, clientId: cfg.clientId, clientSecret: cfg.clientSecret });
  }

  /** Idempotently maps a PayKH customer to a PayChain wallet (safe to call repeatedly). */
  async ensureCustomerWallet(customerId: string): Promise<WalletResult> {
    return this.call('ensureCustomerWallet', () =>
      this.client.wallets.create(
        { ownerType: 'CUSTOMER', ownerReference: `paykh:${customerId}` },
        `paykh:wallet:${customerId}`,
      ),
    );
  }

  /** Purchase reward via the rules engine (spend → points). */
  async awardPurchaseReward(input: {
    eventId: string;
    walletId: string;
    spendAmount: string;
    currency: string;
    merchantId?: string;
  }): Promise<EarnResult> {
    return this.call('awardPurchaseReward', () =>
      this.client.assets.earn(
        this.cfg.loyaltyAssetId,
        { walletId: input.walletId, spendAmount: input.spendAmount, currency: input.currency, merchantId: input.merchantId },
        `paykh:earn:${input.eventId}`,
      ),
    );
  }

  /** Referral reward — a fixed points grant. */
  async awardReferralReward(input: { eventId: string; walletId: string; points: string }): Promise<TxResult> {
    return this.call('awardReferralReward', () =>
      this.client.assets.issue(
        this.cfg.loyaltyAssetId,
        { destinationWalletId: input.walletId, amount: input.points },
        `paykh:referral:${input.eventId}`,
      ),
    );
  }

  /** Scratch-game reward — a fixed points grant keyed by the game play id. */
  async awardScratchGameReward(input: { playId: string; walletId: string; points: string }): Promise<TxResult> {
    return this.call('awardScratchGameReward', () =>
      this.client.assets.issue(
        this.cfg.loyaltyAssetId,
        { destinationWalletId: input.walletId, amount: input.points },
        `paykh:scratch:${input.playId}`,
      ),
    );
  }

  /** Redeem points (e.g. for a voucher). */
  async redeemPoints(input: { eventId: string; walletId: string; points: string }): Promise<TxResult> {
    return this.call('redeemPoints', () =>
      this.client.assets.redeem(
        this.cfg.loyaltyAssetId,
        { sourceWalletId: input.walletId, amount: input.points },
        `paykh:redeem:${input.eventId}`,
      ),
    );
  }

  /** Transfer points between customers (gifting), when enabled. */
  async transferPoints(input: {
    eventId: string;
    fromWalletId: string;
    toWalletId: string;
    points: string;
  }): Promise<TxResult> {
    return this.call('transferPoints', () =>
      this.client.assets.transfer(
        this.cfg.loyaltyAssetId,
        { sourceWalletId: input.fromWalletId, destinationWalletId: input.toWalletId, amount: input.points },
        `paykh:transfer:${input.eventId}`,
      ),
    );
  }

  /** Current loyalty-point balance for a wallet. */
  async getPointsBalance(walletId: string): Promise<string> {
    const balances = (await this.call('getPointsBalance', () => this.client.wallets.balances(walletId))) as BalanceView[];
    const points = balances.find((b) => b.assetCode === this.cfg.loyaltyAssetCode);
    return points?.balance ?? '0';
  }

  async getTransactionStatus(transactionId: string): Promise<TxResult> {
    return this.call('getTransactionStatus', () => this.client.transactions.get(transactionId));
  }

  private async call<T>(operation: string, fn: () => Promise<unknown>): Promise<T> {
    try {
      return (await fn()) as T;
    } catch (err) {
      // Wrap SDK/PayChainError with PayKH context. A 409 (idempotency conflict) means a
      // different payload reused a key — PayKH should investigate, not blindly retry.
      throw new PayKhIntegrationError(operation, err instanceof Error ? err.message : 'unknown error', err);
    }
  }
}
