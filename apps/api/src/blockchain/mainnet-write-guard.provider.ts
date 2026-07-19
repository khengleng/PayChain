import {
  BlockchainProviderError,
  type AssetBalance,
  type BlockchainProvider,
  type BlockchainTransaction,
  type BlockchainTransactionResult,
  type BurnAssetInput,
  type CreateAssetInput,
  type CreateAssetResult,
  type CreateWalletInput,
  type CreateWalletResult,
  type EstimateFeeInput,
  type FeeEstimate,
  type FreezeWalletInput,
  type GetBalanceInput,
  type GetHistoryInput,
  type GetTransactionInput,
  type IssueAssetInput,
  type NetworkName,
  type ProviderHealth,
  type RedeemAssetInput,
  type TransferAssetInput,
  type TrustlineInput,
  type TrustlineResult,
  type UnfreezeWalletInput,
} from '@paychain/blockchain';

/**
 * Enforces the mainnet write gate (§0.7). On MAINNET, the value-moving on-chain writes
 * (issue/transfer/redeem/burn) are refused unless `stablecoin.mainnet.enabled` is on — the
 * readiness-gated platform kill-switch. This is the single chokepoint every API-initiated on-chain
 * value movement passes through, so the flag is consumed once rather than sprinkled across sagas.
 *
 * On testnet/futurenet this is a transparent pass-through (the flag is not checked), so there is no
 * behaviour change off mainnet — and mainnet itself stays unbootable until an external signer is
 * configured, so today the guard is dormant defence-in-depth. Read paths and account/control ops
 * (createWallet, trustline, freeze/unfreeze — a freeze must work even when writes are paused) are
 * never gated.
 */
export class MainnetWriteGuardProvider implements BlockchainProvider {
  constructor(
    private readonly delegate: BlockchainProvider,
    private readonly network: NetworkName,
    private readonly mainnetWritesEnabled: () => Promise<boolean>,
  ) {}

  private async assertWriteAllowed(op: string): Promise<void> {
    if (this.network !== 'mainnet') return;
    if (!(await this.mainnetWritesEnabled())) {
      throw new BlockchainProviderError(
        `Mainnet writes are disabled: ${op} refused until stablecoin.mainnet.enabled is turned on ` +
          `via the readiness-gated mainnet-enable path.`,
        'MAINNET_WRITES_DISABLED',
        false,
      );
    }
  }

  // --- gated value movements ---
  async issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    await this.assertWriteAllowed('issueAsset');
    return this.delegate.issueAsset(input);
  }
  async transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    await this.assertWriteAllowed('transferAsset');
    return this.delegate.transferAsset(input);
  }
  async redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    await this.assertWriteAllowed('redeemAsset');
    return this.delegate.redeemAsset(input);
  }
  async burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    await this.assertWriteAllowed('burnAsset');
    return this.delegate.burnAsset(input);
  }

  // --- pass-through (reads + account/control ops) ---
  createWallet(input: CreateWalletInput): Promise<CreateWalletResult> {
    return this.delegate.createWallet(input);
  }
  createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    return this.delegate.createAsset(input);
  }
  establishTrustline(input: TrustlineInput): Promise<TrustlineResult> {
    return this.delegate.establishTrustline(input);
  }
  freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.delegate.freezeWallet(input);
  }
  unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.delegate.unfreezeWallet(input);
  }
  getBalance(input: GetBalanceInput): Promise<AssetBalance[]> {
    return this.delegate.getBalance(input);
  }
  getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction> {
    return this.delegate.getTransaction(input);
  }
  getTransactionHistory(input: GetHistoryInput): Promise<BlockchainTransaction[]> {
    return this.delegate.getTransactionHistory(input);
  }
  estimateFee(input: EstimateFeeInput): Promise<FeeEstimate> {
    return this.delegate.estimateFee(input);
  }
  healthCheck(): Promise<ProviderHealth> {
    return this.delegate.healthCheck();
  }
}
