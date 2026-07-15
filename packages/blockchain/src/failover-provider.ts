import { CircuitBreaker, type CircuitBreakerOptions, withTimeout } from './circuit-breaker';
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

  private async run<T>(op: string, fn: (p: BlockchainProvider) => Promise<T>): Promise<T> {
    const errors: string[] = [];
    for (const entry of this.entries) {
      try {
        return await entry.breaker.execute(() => withTimeout(fn(entry.provider), this.timeoutMs));
      } catch (err) {
        errors.push(`${entry.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    throw new BlockchainProviderError(
      `All blockchain providers failed for ${op} (${errors.join('; ')})`,
      'ALL_PROVIDERS_FAILED',
      true,
    );
  }

  createWallet(input: CreateWalletInput): Promise<CreateWalletResult> {
    return this.run('createWallet', (p) => p.createWallet(input));
  }
  createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    return this.run('createAsset', (p) => p.createAsset(input));
  }
  establishTrustline(input: TrustlineInput): Promise<TrustlineResult> {
    return this.run('establishTrustline', (p) => p.establishTrustline(input));
  }
  issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('issueAsset', (p) => p.issueAsset(input));
  }
  transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('transferAsset', (p) => p.transferAsset(input));
  }
  redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('redeemAsset', (p) => p.redeemAsset(input));
  }
  burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    return this.run('burnAsset', (p) => p.burnAsset(input));
  }
  freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.run('freezeWallet', (p) => p.freezeWallet(input));
  }
  unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.run('unfreezeWallet', (p) => p.unfreezeWallet(input));
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
