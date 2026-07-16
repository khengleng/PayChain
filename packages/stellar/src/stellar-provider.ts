import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  type FeeBumpTransaction,
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
 * Fee-bump bid as a multiple of BASE_FEE. Must exceed the inner transaction's per-op fee; the
 * margin absorbs a rise in the network minimum rather than failing the customer's transaction.
 */
const FEE_BUMP_MULTIPLIER = 10;

/**
 * Stellar implementation of BlockchainProvider (README §9, §10).
 *
 * This is the ONLY package permitted to import the Stellar SDK. It translates the
 * provider-agnostic domain types into classic Stellar operations over Horizon.
 *
 * Loyalty points are modeled as classic Stellar assets.
 * - Account funding: sponsored reserves when a sponsor is configured (§10), otherwise friendbot.
 *   Friendbot is testnet-only, so sponsorship is the only funding path that works off testnet.
 *   Customers never hold or purchase XLM under either strategy.
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

  /**
   * Creates a customer account (§10).
   *
   * Prefers sponsored reserves when a sponsor is configured: the sponsor pays the account's base
   * reserve, so the customer holds zero XLM and never has to acquire any. Falls back to friendbot
   * for local/testnet development. Friendbot does not exist off testnet, so sponsorship is the
   * only funding path that works on mainnet.
   */
  async createWallet(_input: CreateWalletInput): Promise<CreateWalletResult> {
    const keypair = Keypair.random();

    if (this.sponsor()) {
      await this.createSponsoredAccount(keypair);
      return { publicKey: keypair.publicKey(), secretKey: keypair.secret(), funded: true };
    }

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

  /**
   * begin/create/end sandwich. `endSponsoringFutureReserves` is sourced from the *sponsored*
   * account, so the transaction needs both signatures — the sponsor authorises paying, and the
   * new account authorises being sponsored. Missing the second signer is the classic way this
   * fails, which is why it is tested against a real network rather than a mock.
   *
   * startingBalance is "0": the sponsor covers the reserve, so the account needs no XLM of its own.
   */
  private async createSponsoredAccount(keypair: Keypair): Promise<void> {
    const sponsor = this.sponsor();
    if (!sponsor) throw new BlockchainProviderError('No sponsor configured', 'SPONSOR_MISSING', false);

    const sponsorAccount = await this.loadAccount(sponsor.publicKey());
    const tx = this.buildTx(sponsorAccount, [
      Operation.beginSponsoringFutureReserves({ sponsoredId: keypair.publicKey() }),
      Operation.createAccount({ destination: keypair.publicKey(), startingBalance: '0' }),
      Operation.endSponsoringFutureReserves({ source: keypair.publicKey() }),
    ]);
    await this.submit(tx, [sponsor, keypair]);
  }

  /** The configured sponsor keypair, or undefined when running unsponsored (friendbot/dev). */
  private sponsor(): Keypair | undefined {
    const secret = this.cfg.sponsorSecretKey;
    if (!secret) return undefined;
    try {
      return Keypair.fromSecret(secret);
    } catch {
      throw new BlockchainProviderError(
        'STELLAR_SPONSOR_SECRET_KEY is not a valid Stellar secret key',
        'SPONSOR_INVALID',
        false,
      );
    }
  }

  async createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    // Classic Stellar assets are implicit: an asset exists once (code, issuer) is used.
    // No on-chain call is required to "create" the asset itself.
    this.assertAssetCode(input.assetCode);
    return { assetCode: input.assetCode, issuerPublicKey: input.issuerPublicKey };
  }

  /**
   * Establishes a trustline (§10). A trustline is its own ledger entry and costs another 0.5 XLM
   * reserve, so sponsoring account creation but not the trustline would still leave the customer
   * needing XLM — the sponsorship has to cover both or it buys nothing.
   *
   * When sponsored, the sponsor is the transaction source (it pays the fee too) and the sandwich
   * wraps changeTrust; both parties sign.
   */
  async establishTrustline(input: TrustlineInput): Promise<TrustlineResult> {
    const asset = new Asset(input.assetCode, input.issuerPublicKey);
    const accountKeypair = Keypair.fromSecret(input.accountSecretKey);
    const sponsor = this.sponsor();

    if (sponsor) {
      const sponsorAccount = await this.loadAccount(sponsor.publicKey());
      const tx = this.buildTx(sponsorAccount, [
        Operation.beginSponsoringFutureReserves({ sponsoredId: input.accountPublicKey }),
        Operation.changeTrust({ asset, source: input.accountPublicKey }),
        Operation.endSponsoringFutureReserves({ source: input.accountPublicKey }),
      ]);
      const result = await this.submit(tx, [sponsor, accountKeypair]);
      return { transactionHash: result.transactionHash };
    }

    const account = await this.loadAccount(input.accountPublicKey);
    const tx = this.buildTx(account, [Operation.changeTrust({ asset })]);
    const result = await this.submit(tx, [accountKeypair]);
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

  /**
   * Signs and submits, wrapping in a fee-bump when a sponsor is configured (§10).
   *
   * Sponsorship covers an account's *reserve*, not its *fees*. A sponsored wallet holds zero XLM,
   * so it cannot pay for its own transactions — without a fee bump it can receive assets but can
   * never send, transfer or redeem them, and a sponsored issuer cannot even issue. The sponsor
   * therefore becomes the fee source for any transaction it did not originate itself.
   *
   * The inner transaction is signed first by its own signers; the fee-bump envelope is then
   * signed by the sponsor. The inner signatures stay valid — a fee bump wraps, it does not alter.
   */
  private async submit(tx: Transaction, signers: Keypair[]): Promise<BlockchainTransactionResult> {
    for (const s of signers) tx.sign(s);

    const sponsor = this.sponsor();
    const envelope =
      sponsor && tx.source !== sponsor.publicKey()
        ? this.feeBump(tx, sponsor)
        : tx;

    try {
      const res = await this.server.submitTransaction(envelope);
      // `submitted: true` = Horizon accepted it. Confirmation is verified separately (§40).
      return { transactionHash: res.hash, submitted: true };
    } catch (err) {
      throw this.wrap(err, 'SUBMIT_FAILED', this.isRetryable(err));
    }
  }

  /**
   * Wraps an already-signed transaction so the sponsor pays its fee (CAP-15).
   *
   * FEE_BUMP_MULTIPLIER gives headroom over the inner fee: a fee bump must bid at least the inner
   * transaction's per-operation fee, and bidding exactly equal leaves no margin when the network
   * raises its minimum under load — the bump would be rejected and the customer's transaction
   * would fail for a reason they cannot fix or even see.
   */
  private feeBump(tx: Transaction, sponsor: Keypair): FeeBumpTransaction {
    const bumped = TransactionBuilder.buildFeeBumpTransaction(
      sponsor,
      String(Number(BASE_FEE) * FEE_BUMP_MULTIPLIER),
      tx,
      this.cfg.networkPassphrase,
    );
    bumped.sign(sponsor);
    return bumped;
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
