import type { NetworkName } from '@paychain/blockchain';

export interface StellarProviderConfig {
  network: NetworkName;
  horizonUrl: string;
  networkPassphrase: string;
  /** Testnet-only account funder. Empty on networks without a friendbot. */
  friendbotUrl?: string;
}
