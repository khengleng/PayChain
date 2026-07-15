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

/**
 * In-memory blockchain provider for tests and load benchmarking (§40, §0.7). It exercises
 * the full pipeline WITHOUT network latency so throughput of PayChain's own code can be
 * measured separately from real-network latency. Never use in production.
 */
export class MockBlockchainProvider implements BlockchainProvider {
  private walletSeq = 0;
  private txSeq = 0;
  private readonly balances = new Map<string, Map<string, number>>();

  private key(assetCode: string, issuer: string): string {
    return `${assetCode}:${issuer}`;
  }
  private ensure(pk: string): Map<string, number> {
    let m = this.balances.get(pk);
    if (!m) {
      m = new Map();
      this.balances.set(pk, m);
    }
    return m;
  }

  async createWallet(_input: CreateWalletInput): Promise<CreateWalletResult> {
    this.walletSeq += 1;
    const publicKey = `GMOCK${String(this.walletSeq).padStart(50, '0')}`;
    this.ensure(publicKey);
    return { publicKey, secretKey: `SMOCK${this.walletSeq}`, funded: true };
  }

  async createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    return { assetCode: input.assetCode, issuerPublicKey: input.issuerPublicKey };
  }

  async establishTrustline(_input: TrustlineInput): Promise<TrustlineResult> {
    return { transactionHash: this.hash() };
  }

  async issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    this.credit(input.destinationPublicKey, this.key(input.assetCode, input.issuerPublicKey), input.amount);
    return { transactionHash: this.hash(), submitted: true };
  }

  async transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    const k = this.key(input.assetCode, input.issuerPublicKey);
    this.debit(input.sourcePublicKey, k, input.amount);
    this.credit(input.destinationPublicKey, k, input.amount);
    return { transactionHash: this.hash(), submitted: true };
  }

  async redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    this.debit(input.sourcePublicKey, this.key(input.assetCode, input.issuerPublicKey), input.amount);
    return { transactionHash: this.hash(), submitted: true };
  }

  async burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    this.debit(input.holderPublicKey, this.key(input.assetCode, input.issuerPublicKey), input.amount);
    return { transactionHash: this.hash(), submitted: true };
  }

  async freezeWallet(_input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return { transactionHash: this.hash(), submitted: true };
  }
  async unfreezeWallet(_input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return { transactionHash: this.hash(), submitted: true };
  }

  async getBalance(input: GetBalanceInput): Promise<AssetBalance[]> {
    const m = this.balances.get(input.publicKey);
    if (!m) return [];
    return [...m.entries()].map(([k, bal]) => {
      const [assetCode, issuerPublicKey] = k.split(':');
      return { assetCode: assetCode!, issuerPublicKey, balance: String(bal) };
    });
  }

  async getTransaction(_input: GetTransactionInput): Promise<BlockchainTransaction> {
    return { transactionHash: _input.transactionHash, status: 'confirmed', ledger: this.txSeq };
  }
  async getTransactionHistory(_input: GetHistoryInput): Promise<BlockchainTransaction[]> {
    return [];
  }
  async estimateFee(_input: EstimateFeeInput): Promise<FeeEstimate> {
    return { fee: '100' };
  }
  async healthCheck(): Promise<ProviderHealth> {
    return { healthy: true, network: 'testnet', latestLedger: this.txSeq };
  }

  private hash(): string {
    this.txSeq += 1;
    return `MOCKTX${String(this.txSeq).padStart(58, '0')}`;
  }
  private credit(pk: string, key: string, amount: string): void {
    const m = this.ensure(pk);
    m.set(key, (m.get(key) ?? 0) + Number(amount));
  }
  private debit(pk: string, key: string, amount: string): void {
    const m = this.ensure(pk);
    const next = (m.get(key) ?? 0) - Number(amount);
    if (next < 0) throw new BlockchainProviderError('insufficient mock balance', 'INSUFFICIENT_BALANCE');
    m.set(key, next);
  }
}
