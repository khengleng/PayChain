import type { BlockchainProvider } from '@paychain/blockchain';
import type { PayChainConfig } from '@paychain/config';
import { StellarProvider } from '@paychain/stellar';

/** Builds the provider-agnostic blockchain client for the worker (§9). */
export function createChainProvider(cfg: PayChainConfig): BlockchainProvider {
  return new StellarProvider({
    network: cfg.STELLAR_NETWORK,
    horizonUrl: cfg.STELLAR_HORIZON_URL,
    networkPassphrase: cfg.STELLAR_NETWORK_PASSPHRASE,
    friendbotUrl: cfg.STELLAR_FRIENDBOT_URL || undefined,
  });
}
