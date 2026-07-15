import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  type Transaction,
  type xdr,
} from '@stellar/stellar-sdk';
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
  type ProviderHealth,
  type RedeemAssetInput,
  type TransferAssetInput,
  type TrustlineInput,
  type TrustlineResult,
  type UnfreezeWalletInput,
} from '@paychain/blockchain';
import type { StellarProviderConfig } from './config';

const TX_TIMEOUT_SECONDS = 60;

/**
 * Stellar implementation of BlockchainProvider (README §9, §10).
 *
 * This is the ONLY package permitted to import the Stellar SDK. It translates the
 * provider-agnostic domain types into classic Stellar operations over Horizon.
 *
 * Scope in M0: loyalty points modeled as classic Stellar assets on TESTNET.
 * - Account funding uses friendbot (testnet). Sponsored-reserve account creation
 *   (begin/end sponsoring future reserves, §10) is a documented M1 follow-up.
 * - freeze/unfreeze require the asset issuer to have AUTH_REVOCABLE set; enforced by
 *   the caller's asset policy, not here.
 */
export class StellarProvider implements BlockchainProvider {
  private readonly server: Horizon.Server;

  constructor(private readonly cfg: StellarProviderConfig) {
    this.server = new Horizon.Server(cfg.horizonUrl, {
      allowHttp: cfg.horizonUrl.startsWith('http://'),
    });
  }

  async createWallet(_input: CreateWalletInput): Promise<CreateWalletResult> {
    const keypair = Keypair.random();
    let funded = false;
    if (this.cfg.friendbotUrl) {
      funded = await this.fundWithFriendbot(keypair.publicKey());
    }
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      funded,
    };
  }

  async createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    // Classic Stellar assets are implicit: an asset exists once (code, issuer) is used.
    // No on-chain call is required to "create" the asset itself.
    this.assertAssetCode(input.assetCode);
    return { assetCode: input.assetCode, issuerPublicKey: input.issuerPublicKey };
  }

  async establishTrustline(input: TrustlineInput): Promise<TrustlineResult> {
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const account = await this.loadAccount(input.accountPublicKey);
    const tx = this.buildTx(account, [Operation.changeTrust({ asset })]);
    const signers = [Keypair.fromSecret(input.accountSecretKey)];
    const result = await this.submit(tx, signers);
    return { transactionHash: result.transactionHash };
  }

  async issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const issuer = await this.loadAccount(input.issuerPublicKey);
    const tx = this.buildTx(issuer, [
      Operation.payment({
        destination: input.destinationPublicKey,
        asset,
        amount: input.amount,
      }),
    ]);
    return this.submit(tx, [Keypair.fromSecret(input.issuerSecretKey)]);
  }

  async transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const source = await this.loadAccount(input.sourcePublicKey);
    const tx = this.buildTx(source, [
      Operation.payment({
        destination: input.destinationPublicKey,
        asset,
        amount: input.amount,
      }),
    ]);
    return this.submit(tx, [Keypair.fromSecret(input.sourceSecretKey)]);
  }

  async redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    // Redemption = send the asset back to its issuer, which removes it from circulation.
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const source = await this.loadAccount(input.sourcePublicKey);
    const tx = this.buildTx(source, [
      Operation.payment({
        destination: input.issuerPublicKey,
        asset,
        amount: input.amount,
      }),
    ]);
    return this.submit(tx, [Keypair.fromSecret(input.sourceSecretKey)]);
  }

  async burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    // Burn = holder sends the asset back to the issuer (supply reduction).
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const holder = await this.loadAccount(input.holderPublicKey);
    const tx = this.buildTx(holder, [
      Operation.payment({
        destination: input.issuerPublicKey,
        asset,
        amount: input.amount,
      }),
    ]);
    return this.submit(tx, [Keypair.fromSecret(input.holderSecretKey)]);
  }

  async freezeWallet(input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.setAuthorized(input, false);
  }

  async unfreezeWallet(input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return this.setAuthorized(input, true);
  }

  async getBalance(input: GetBalanceInput): Promise<AssetBalance[]> {
    const account = await this.loadAccount(input.publicKey);
    return account.balances.map((b) => {
      if (b.asset_type === 'native') {
        return { assetCode: 'XLM', balance: b.balance };
      }
      const line = b as { asset_code: string; asset_issuer: string; balance: string };
      return {
        assetCode: line.asset_code,
        issuerPublicKey: line.asset_issuer,
        balance: line.balance,
      };
    });
  }

  async getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction> {
    try {
      const tx = await this.server.transactions().transaction(input.transactionHash).call();
      return {
        transactionHash: tx.hash,
        status: tx.successful ? 'confirmed' : 'failed',
        ledger: tx.ledger_attr,
        createdAt: tx.created_at,
      };
    } catch (err) {
      if (this.isNotFound(err)) {
        return { transactionHash: input.transactionHash, status: 'not_found' };
      }
      throw this.wrap(err, 'GET_TRANSACTION_FAILED');
    }
  }

  async getTransactionHistory(input: GetHistoryInput): Promise<BlockchainTransaction[]> {
    const page = await this.server
      .transactions()
      .forAccount(input.publicKey)
      .limit(input.limit ?? 20)
      .order('desc')
      .call();
    return page.records.map((tx) => ({
      transactionHash: tx.hash,
      status: tx.successful ? 'confirmed' : 'failed',
      ledger: tx.ledger_attr,
      createdAt: tx.created_at,
    }));
  }

  async estimateFee(input: EstimateFeeInput): Promise<FeeEstimate> {
    const ops = input.operationCount ?? 1;
    return { fee: (Number(BASE_FEE) * ops).toString() };
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const ledger = await this.server.ledgers().order('desc').limit(1).call();
      const latest = ledger.records[0]?.sequence;
      return { healthy: true, network: this.cfg.network, latestLedger: latest };
    } catch (err) {
      return {
        healthy: false,
        network: this.cfg.network,
        detail: err instanceof Error ? err.message : 'unknown',
      };
    }
  }

  // --- internals -----------------------------------------------------------

  private async setAuthorized(
    input: FreezeWalletInput,
    authorized: boolean,
  ): Promise<BlockchainTransactionResult> {
    const issuer = await this.loadAccount(input.issuerPublicKey);
    const tx = this.buildTx(issuer, [
      Operation.setTrustLineFlags({
        trustor: input.targetPublicKey,
        asset: new Asset(input.assetCode, input.issuerPublicKey),
        flags: { authorized },
      }),
    ]);
    return this.submit(tx, [Keypair.fromSecret(input.issuerSecretKey)]);
  }

  private buildTx(source: Horizon.AccountResponse, operations: xdr.Operation[]): Transaction {
    const builder = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.cfg.networkPassphrase,
    });
    for (const op of operations) builder.addOperation(op);
    return builder.setTimeout(TX_TIMEOUT_SECONDS).build();
  }

  private async submit(tx: Transaction, signers: Keypair[]): Promise<BlockchainTransactionResult> {
    for (const s of signers) tx.sign(s);
    try {
      const res = await this.server.submitTransaction(tx);
      // `submitted: true` = Horizon accepted it. Confirmation is verified separately (§40).
      return { transactionHash: res.hash, submitted: true };
    } catch (err) {
      throw this.wrap(err, 'SUBMIT_FAILED', this.isRetryable(err));
    }
  }

  private async loadAccount(publicKey: string): Promise<Horizon.AccountResponse> {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (err) {
      if (this.isNotFound(err)) {
        throw new BlockchainProviderError(
          `Stellar account not found or not funded: ${publicKey}`,
          'ACCOUNT_NOT_FOUND',
          false,
          err,
        );
      }
      throw this.wrap(err, 'LOAD_ACCOUNT_FAILED', this.isRetryable(err));
    }
  }

  private async fundWithFriendbot(publicKey: string): Promise<boolean> {
    if (!this.cfg.friendbotUrl) return false;
    const url = `${this.cfg.friendbotUrl}?addr=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new BlockchainProviderError(
        `Friendbot funding failed (${res.status}) for ${publicKey}`,
        'FRIENDBOT_FAILED',
        true,
      );
    }
    return true;
  }

  private assertAssetCode(code: string): void {
    if (!/^[A-Za-z0-9]{1,12}$/.test(code)) {
      throw new BlockchainProviderError(
        `Invalid Stellar asset code: "${code}" (1-12 alphanumeric chars)`,
        'INVALID_ASSET_CODE',
      );
    }
  }

  private isNotFound(err: unknown): boolean {
    return this.statusOf(err) === 404;
  }

  private isRetryable(err: unknown): boolean {
    const status = this.statusOf(err);
    return status === 429 || status === 503 || status === 504;
  }

  private statusOf(err: unknown): number | undefined {
    if (err && typeof err === 'object' && 'response' in err) {
      const resp = (err as { response?: { status?: number } }).response;
      return resp?.status;
    }
    return undefined;
  }

  private wrap(err: unknown, code: string, retryable = false): BlockchainProviderError {
    const message = err instanceof Error ? err.message : 'Unknown Stellar error';
    return new BlockchainProviderError(message, code, retryable, err);
  }
}
