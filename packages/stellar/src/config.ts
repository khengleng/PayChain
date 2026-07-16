import type { NetworkName } from '@paychain/blockchain';

export interface StellarProviderConfig {
  network: NetworkName;
  horizonUrl: string;
  networkPassphrase: string;
  /** Testnet-only account funder. Empty on networks without a friendbot. */
  friendbotUrl?: string;

  /**
   * Sponsor account that pays customers' base reserves (§10).
   *
   * Stellar locks 0.5 XLM per ledger entry: an account costs one reserve, each trustline another.
   * Sponsorship makes this account pay them, so a customer never holds or buys XLM. When set, it
   * is used in preference to friendbot — and it is the ONLY funding path that exists off testnet,
   * since friendbot is testnet-only.
   *
   * Capital note: every sponsored wallet with one trustline locks ~1 XLM here. It is recoverable
   * by revoking sponsorship, but it scales linearly with customers.
   *
   * Custody note: this key can spend the entire sponsor balance, so it belongs behind KMS/HSM
   * before mainnet (§0.6 key_management gate) rather than in process memory.
   */
  sponsorPublicKey?: string;
  sponsorSecretKey?: string;
}
