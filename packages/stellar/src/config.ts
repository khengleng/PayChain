import type { Horizon } from '@stellar/stellar-sdk';
import type { Lock, NetworkName } from '@paychain/blockchain';
import type { TransactionSigner } from './signer';

export interface StellarProviderConfig {
  network: NetworkName;

  /**
   * The signing seam (§0.6, §11). When omitted, StellarProvider defaults to the in-process
   * LocalDevSigner (dev/testnet behaviour). A mainnet deployment MUST pass an external HSM/KMS
   * signer here.
   *
   * Note this seam abstracts the signing CALL. Achieving "the key never enters application memory"
   * end-to-end also requires the upstream call sites to stop decrypting secrets and pass key
   * references instead of raw *SecretKey inputs — a follow-on step. Until then the socket exists and
   * a real signer can resolve keys internally, but the domain inputs still carry secrets.
   */
  signer?: TransactionSigner;

  /** Test-only: inject a pre-built Horizon server. Production builds one from `horizonUrl`. */
  server?: Horizon.Server;

  /**
   * Serializes submissions per source account (§12).
   *
   * Stellar transactions consume the source account's sequence number, so two transactions built
   * concurrently from one account claim the same sequence and one is rejected. That is not
   * hypothetical here: every sponsored createAccount is sourced from the sponsor, and every issue
   * from the asset's issuer — so wallet creation and point issuance are exactly the operations
   * that collide under load.
   *
   * Pass a RedisLock in production: an in-process lock cannot serialize across API instances or
   * between the API and the worker, which both submit from the same accounts. Omitting the lock
   * entirely is safe only single-threaded (tests, local dev).
   *
   * Note fee bumps do NOT consume the fee source's sequence, so a sponsor paying fees for a
   * customer's transaction needs no lock — only the true source account matters.
   */
  lock?: Lock;
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
