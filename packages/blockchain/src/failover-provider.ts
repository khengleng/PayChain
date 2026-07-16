import { CircuitBreaker, CircuitOpenError, type CircuitBreakerOptions, withTimeout } from './circuit-breaker';
import { BlockchainProviderError, type BlockchainProvider } from './provider';
import type {
  AssetBalance,
  BlockchainTransaction,
  BlockchainTransactionResult,
  BurnAssetInput,
  CreateAssetInput,
  CreateAssetResult,
  CreateWalletInput,
  CreateWalletResult,
  EstimateFeeInput,
  FeeEstimate,
  FreezeWalletInput,
  GetBalanceInput,
  GetHistoryInput,
  GetTransactionInput,
  IssueAssetInput,
  ProviderHealth,
  RedeemAssetInput,
  TransferAssetInput,
  TrustlineInput,
  TrustlineResult,
  UnfreezeWalletInput,
} from './types';

export interface NamedProvider {
  name: string;
  provider: BlockchainProvider;
}

export interface FailoverOptions {
  /** Per-attempt timeout (§40 RPC timeout handling). */
  timeoutMs?: number;
  circuit?: CircuitBreakerOptions;
}

/**
 * Wraps an ordered list of providers with per-provider circuit breakers and timeouts (§40,
 * §98). Each call tries providers in order, skipping ones whose circuit is open, and fails
 * over on error/timeout. If all providers fail, a single retryable error is raised. This is
 * how PayChain survives a primary RPC outage without changing business logic.
 */
export class FailoverBlockchainProvider implements BlockchainProvider {
  private readonly entries: Array<{ name: string; provider: BlockchainProvider; breaker: CircuitBreaker }>;
  private readonly timeoutMs: number;

  constructor(providers: NamedProvider[], opts: FailoverOptions = {}) {
    if (providers.length === 0) throw new Error('FailoverBlockchainProvider requires at least one provider');
    this.entries = providers.map((p) => ({
      name: p.name,
      provider: p.provider,
      breaker: new CircuitBreaker(p.name, opts.circuit),
    }));
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  /**
   * @param isWrite  A state-changing/broadcasting op. Writes only fail over to the next
   * provider when the current one's circuit is OPEN (the request was definitely never sent).
   * On any other error (e.g. a timeout, where the write may already be in flight) a write is
   * NOT retried on another provider — re-submitting could double-spend. Reads fail over freely.
   */
  private async run<T>(
    op: string,
    fn: (p: BlockchainProvider) => Promise<T>,
    isWrite = false,
  ): Promise<T> {
    const errors: string[] = [];
    for (const entry of this.entries) {
      try {
        return await entry.breaker.execute(() => withTimeout(fn(entry.provider), this.timeoutMs));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${entry.name}: ${msg}`);
        // For a write, only continue to the next provider if this one never sent the request
        // (circuit open). Otherwise stop — the write may have landed; the caller reconciles.
        if (isWrite && !(err instanceof CircuitOpenError)) {
          throw new BlockchainProviderError(
            `Write ${op} failed on ${entry.name} and is not safe to retry on another provider (${msg})`,
            'WRITE_NOT_RETRYABLE',
            false,
            err,
          );
        }
      }
    }
    throw new BlockchainProviderError(
      `All blockchain providers failed for ${op} (${errors.join('; ')})`,
      'ALL_PROVIDERS_FAILED',
      true,
    );
  }

  createWallet(input: CreateWalletInput): Promise<CreateWalletResult> {
    // Generates a fresh keypair per call — do not fail over (would create two wallets).
    return this.run('createWallet', (p) => p.createWallet(input), true);
  }
  createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    return this.run('createAsset', (p) => p.createAsset(input)); // no chain write — safe to fail over
  }
  establishTrustline(input: TrustlineInput): Promise<TrustlineResult> {
    return this.run('establishTrustline', (p) => p.establishTrustline(input), true);
  }
  issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('issueAsset', (p) => p.issueAsset(input), true);
  }
  transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('transferAsset', (p) => p.transferAsset(input), true);
  }
  redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('redeemAsset', (p) => p.redeemAsset(input), true);
  }
  burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('burnAsset', (p) => p.burnAsset(input), true);
  }
  freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.run('freezeWallet', (p) => p.freezeWallet(input), true);
  }
  unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.run('unfreezeWallet', (p) => p.unfreezeWallet(input), true);
  }
  getBalance(input: GetBalanceInput): Promise<AssetBalance[]> {
    return this.run('getBalance', (p) => p.getBalance(input));
  }
  getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction> {
    return this.run('getTransaction', (p) => p.getTransaction(input));
  }
  getTransactionHistory(input: GetHistoryInput): Promise<BlockchainTransaction[]> {
    return this.run('getTransactionHistory', (p) => p.getTransactionHistory(input));
  }
  estimateFee(input: EstimateFeeInput): Promise<FeeEstimate> {
    return this.run('estimateFee', (p) => p.estimateFee(input));
  }

  async healthCheck(): Promise<ProviderHealth> {
    const results = await Promise.all(
      this.entries.map(async (e) => {
        try {
          return await e.provider.healthCheck();
        } catch {
          return { healthy: false, network: 'testnet' as const, detail: `${e.name} unreachable` };
        }
      }),
    );
    const healthy = results.find((r) => r.healthy);
    return healthy ?? results[0]!;
  }
}
