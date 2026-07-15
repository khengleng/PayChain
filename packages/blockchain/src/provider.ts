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

/**
 * The single blockchain abstraction the business layer is allowed to depend on (§9).
 *
 * Only provider packages (e.g. @paychain/stellar) may import chain-specific SDKs and
 * implement this interface. Swapping or adding a chain must not require changes to
 * business logic.
 */
export interface BlockchainProvider {
  createWallet(input: CreateWalletInput): Promise<CreateWalletResult>;
  createAsset(input: CreateAssetInput): Promise<CreateAssetResult>;
  establishTrustline(input: TrustlineInput): Promise<TrustlineResult>;
  issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult>;
  transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult>;
  redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult>;
  burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult>;
  freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult>;
  unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult>;
  getBalance(input: GetBalanceInput): Promise<AssetBalance[]>;
  getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction>;
  getTransactionHistory(input: GetHistoryInput): Promise<BlockchainTransaction[]>;
  estimateFee(input: EstimateFeeInput): Promise<FeeEstimate>;
  healthCheck(): Promise<ProviderHealth>;
}

/** Base class for provider errors so the business layer can catch without SDK coupling. */
export class BlockchainProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean = false,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BlockchainProviderError';
  }
}
