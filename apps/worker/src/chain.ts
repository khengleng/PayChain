import {
  FailoverBlockchainProvider,
  type BlockchainProvider,
  type NamedProvider,
} from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider, selectSigner } from '@paychain/stellar';

/**
 * Builds the provider-agnostic blockchain client for the worker (§9), wrapped in failover
 * with circuit breakers + timeouts (§40) so a degraded RPC endpoint fails fast rather than
 * hanging background jobs.
 */
export function createChainProvider(cfg: PayChainConfig): BlockchainProvider {
  // Every signature goes through this seam. local-dev signs in-process; a real signer is required
  // (and config-enforced) before mainnet. Chosen once and shared by both provider instances.
  const signer = selectSigner(cfg.KEY_MANAGEMENT_PROVIDER);
  const makeStellar = (horizonUrl: string) =>
    new StellarProvider({
      network: cfg.STELLAR_NETWORK,
      horizonUrl,
      networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
      friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
      signer,
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
