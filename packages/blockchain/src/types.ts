/**
 * Provider-agnostic blockchain domain types (README §9).
 *
 * The business layer depends ONLY on these types — never on Stellar SDK types.
 * Any concrete provider (Stellar today, others later) maps its own SDK types to/from
 * these. This is what keeps PayChain blockchain-provider-agnostic.
 */

export type NetworkName = 'testnet' | 'futurenet' | 'mainnet';

/** A stringified integer/decimal amount. Never a JS number — we do not do float money. */
export type Amount = string;

export interface CreateWalletInput {
  /** Correlation id threaded through the whole pipeline (§0.5). */
  correlationId: string;
  /** Public key of the account that sponsors reserves/fees for this wallet (§10). */
  sponsorPublicKey?: string;
}

export interface CreateWalletResult {
  publicKey: string;
  /** Present only for dev-local key management; never returned to API clients (§11, §41). */
  secretKey?: string;
  funded: boolean;
}

export interface CreateAssetInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
}

export interface CreateAssetResult {
  assetCode: string;
  issuerPublicKey: string;
}

export interface TrustlineInput {
  correlationId: string;
  accountPublicKey: string;
  accountSecretKey: string;
  assetCode: string;
  issuerPublicKey: string;
  /** Account that pays the trustline reserve (§10). */
  sponsorPublicKey?: string;
  sponsorSecretKey?: string;
}

export interface TrustlineResult {
  transactionHash: string;
}

export interface IssueAssetInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
  issuerSecretKey: string;
  destinationPublicKey: string;
  amount: Amount;
}

export interface TransferAssetInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
  sourcePublicKey: string;
  sourceSecretKey: string;
  destinationPublicKey: string;
  amount: Amount;
}

export interface RedeemAssetInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
  /** The holder redeeming back to the issuer/redemption account. */
  sourcePublicKey: string;
  sourceSecretKey: string;
  amount: Amount;
}

export interface BurnAssetInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
  holderPublicKey: string;
  holderSecretKey: string;
  amount: Amount;
}

export interface FreezeWalletInput {
  correlationId: string;
  assetCode: string;
  issuerPublicKey: string;
  issuerSecretKey: string;
  targetPublicKey: string;
}

export type UnfreezeWalletInput = FreezeWalletInput;

export interface GetBalanceInput {
  publicKey: string;
}

export interface AssetBalance {
  assetCode: string;
  issuerPublicKey?: string;
  balance: Amount;
}

export interface GetTransactionInput {
  transactionHash: string;
}

export interface GetHistoryInput {
  publicKey: string;
  limit?: number;
}

export type BlockchainTransactionStatus = 'pending' | 'confirmed' | 'failed' | 'not_found';

export interface BlockchainTransaction {
  transactionHash: string;
  status: BlockchainTransactionStatus;
  ledger?: number;
  createdAt?: string;
}

export interface BlockchainTransactionResult {
  transactionHash: string;
  /**
   * Submission acceptance ONLY. Never treat this as confirmation (§40, §47).
   * Confirmation is established separately via getTransaction/confirmation listeners.
   */
  submitted: boolean;
}

export interface EstimateFeeInput {
  operationCount?: number;
}

export interface FeeEstimate {
  /** Fee in stroops (Stellar) or provider-native minor units. */
  fee: Amount;
}

export interface ProviderHealth {
  healthy: boolean;
  network: NetworkName;
  latestLedger?: number;
  detail?: string;
}
