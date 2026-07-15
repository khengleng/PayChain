import {
  FailoverBlockchainProvider,
  type BlockchainProvider,
  type NamedProvider,
} from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';

/**
 * Builds the provider-agnostic blockchain client for the worker (§9), wrapped in failover
 * with circuit breakers + timeouts (§40) so a degraded RPC endpoint fails fast rather than
 * hanging background jobs.
 */
export function createChainProvider(cfg: PayChainConfig): BlockchainProvider {
  const makeStellar = (horizonUrl: string) =>
    new StellarProvider({
      network: cfg.STELLAR_NETWORK,
      horizonUrl,
      networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
      friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
    });

  const providers: NamedProvider[] = [
    { name: 'stellar-primary', provider: makeStellar(cfg.STELLAR_HORIZON_URL) },
  ];
  if (cfg.STELLAR_RPC_SECONDARY_URL) {
    providers.push({ name: 'stellar-secondary', provider: makeStellar(cfg.STELLAR_RPC_SECONDARY_URL) });
  }
  return new FailoverBlockchainProvider(providers, {
    timeoutMs: 20_000,
    circuit: { failureThreshold: 5, resetTimeoutMs: 30_000 },
  });
}
