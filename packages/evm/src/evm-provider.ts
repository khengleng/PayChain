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
import type { EvmChainClient, EvmProviderConfig, KnownToken } from './client';
import { fromBaseUnits, toBaseUnits } from './units';

/** Assumed gas per ERC-20 op for a cheap fee estimate (mint/transfer/burn are ~50–70k on an L2). */
const GAS_PER_OP = 70_000n;

/**
 * Custodial EVM (Base) implementation of BlockchainProvider (§9).
 *
 * PayChain holds the minter key and every per-customer account key and signs on their behalf — the
 * same custody model as the Stellar provider (which decrypts stellarSecretEnc). The on-chain
 * accounts exist so a customer can view their coin in MetaMask by the ERC-20 contract address. The
 * reserve controls, mint gating, and tie-out live in the business layer and are unchanged.
 *
 * Domain-type mapping:
 * - publicKey        ↔ 0x account address
 * - secretKey        ↔ 0x account private key (custodial)
 * - issuerPublicKey  ↔ the ERC-20 contract address (the "asset")
 * - issuerSecretKey  ↔ the MINTER_ROLE private key
 * - amount           ↔ decimal string, converted to token base units via the token's decimals
 *
 * ERC-20 differences from Stellar, handled honestly rather than faked:
 * - No trustlines: establishTrustline is a no-op (nothing to authorize before receiving).
 * - No per-account freeze on a plain ERC-20: freeze/unfreeze are enforced app-side (a frozen wallet
 *   is one PayChain refuses to custodially sign for); the chain call is a documented no-op.
 * - getTransactionHistory needs an indexer; unsupported in Phase 1 (see method).
 */
export class EvmProvider implements BlockchainProvider {
  private readonly client: EvmChainClient;
  private readonly confirmations: number;
  private readonly knownTokens: KnownToken[];
  private readonly decimalsCache = new Map<string, number>();

  constructor(private readonly cfg: EvmProviderConfig) {
    this.client = cfg.client;
    this.confirmations = cfg.confirmations ?? 2;
    this.knownTokens = cfg.knownTokens ?? [];
  }

  private async decimalsOf(token: string): Promise<number> {
    const key = token.toLowerCase();
    const cached = this.decimalsCache.get(key);
    if (cached !== undefined) return cached;
    const d = await this.client.erc20Decimals(token);
    this.decimalsCache.set(key, d);
    return d;
  }

  async createWallet(_input: CreateWalletInput): Promise<CreateWalletResult> {
    const account = this.client.generateAccount();
    let funded = false;
    // Custodial analog of Stellar sponsored reserves: drip a little native ETH so the account can
    // later pay gas to move its own tokens. Best-effort — an unfunded account is still valid and can
    // be funded out-of-band; we do not fail wallet creation on a gas-drip hiccup.
    if (this.cfg.gasFunderSecretKey && this.cfg.gasDripWei && this.cfg.gasDripWei > 0n) {
      try {
        await this.client.sendNative(this.cfg.gasFunderSecretKey, account.address, this.cfg.gasDripWei);
        funded = true;
      } catch {
        funded = false;
      }
    }
    return { publicKey: account.address, secretKey: account.privateKey, funded };
  }

  /**
   * On EVM the "asset" is a deployed ERC-20 contract. Deployment is out-of-band (the operator runs
   * the Foundry deploy script and registers the address + minter key), mirroring how issuer/HSM
   * accounts are provisioned outside the app. So this echoes the provided identity — the contract is
   * assumed to already exist at issuerPublicKey.
   */
  async createAsset(input: CreateAssetInput): Promise<CreateAssetResult> {
    return { assetCode: input.assetCode, issuerPublicKey: input.issuerPublicKey };
  }

  /** ERC-20 needs no trustline before receiving. No-op with a clearly-synthetic marker hash. */
  async establishTrustline(_input: TrustlineInput): Promise<TrustlineResult> {
    return { transactionHash: 'evm:no-trustline-required' };
  }

  async issueAsset(input: IssueAssetInput): Promise<BlockchainTransactionResult> {
    const token = input.issuerPublicKey;
    const amount = toBaseUnits(input.amount, await this.decimalsOf(token));
    const hash = await this.client.erc20Mint(token, input.issuerSecretKey, input.destinationPublicKey, amount);
    return { transactionHash: hash, submitted: true };
  }

  async transferAsset(input: TransferAssetInput): Promise<BlockchainTransactionResult> {
    const token = input.issuerPublicKey;
    const amount = toBaseUnits(input.amount, await this.decimalsOf(token));
    const hash = await this.client.erc20Transfer(token, input.sourceSecretKey, input.destinationPublicKey, amount);
    return { transactionHash: hash, submitted: true };
  }

  /**
   * Redemption reduces supply (reserve released off-chain). On Stellar this is a return-to-issuer,
   * which auto-burns; the faithful ERC-20 equivalent is a holder burn — same supply effect.
   */
  async redeemAsset(input: RedeemAssetInput): Promise<BlockchainTransactionResult> {
    const token = input.issuerPublicKey;
    const amount = toBaseUnits(input.amount, await this.decimalsOf(token));
    const hash = await this.client.erc20Burn(token, input.sourceSecretKey, amount);
    return { transactionHash: hash, submitted: true };
  }

  async burnAsset(input: BurnAssetInput): Promise<BlockchainTransactionResult> {
    const token = input.issuerPublicKey;
    const amount = toBaseUnits(input.amount, await this.decimalsOf(token));
    const hash = await this.client.erc20Burn(token, input.holderSecretKey, amount);
    return { transactionHash: hash, submitted: true };
  }

  /**
   * A plain ERC-20 has no per-account freeze. In the custodial model the real freeze is that
   * PayChain declines to sign for a frozen wallet (enforced by wallet status in the business layer),
   * so the on-chain call is a documented no-op rather than a fake or a hard failure that would break
   * the emergency freeze path. On-chain enforcement would require a pausable/blacklist token (Phase 2).
   */
  async freezeWallet(_input: FreezeWalletInput): Promise<BlockchainTransactionResult> {
    return { transactionHash: 'evm:freeze-enforced-app-side', submitted: false };
  }

  async unfreezeWallet(_input: UnfreezeWalletInput): Promise<BlockchainTransactionResult> {
    return { transactionHash: 'evm:unfreeze-enforced-app-side', submitted: false };
  }

  /**
   * EVM has no on-chain trustline list to derive an account's holdings from, so without an indexer we
   * can only report balances for token contracts the provider is configured to know about. Phase 1
   * covers the single configured platform coin; multi-merchant-coin enumeration is a Phase-2 indexer.
   */
  async getBalance(input: GetBalanceInput): Promise<AssetBalance[]> {
    const balances: AssetBalance[] = [];
    for (const token of this.knownTokens) {
      const raw = await this.client.erc20BalanceOf(token.address, input.publicKey);
      balances.push({
        assetCode: token.assetCode,
        issuerPublicKey: token.address,
        balance: fromBaseUnits(raw, await this.decimalsOf(token.address)),
      });
    }
    return balances;
  }

  async getTransaction(input: GetTransactionInput): Promise<BlockchainTransaction> {
    const receipt = await this.client.receipt(input.transactionHash);
    if (!receipt) {
      return { transactionHash: input.transactionHash, status: 'not_found' };
    }
    if (receipt.status === 'reverted') {
      return { transactionHash: input.transactionHash, status: 'failed', ledger: Number(receipt.blockNumber) };
    }
    // Probabilistic finality: 'confirmed' only after enough blocks have built on top (unlike
    // Stellar's deterministic close). Until then it is accepted-but-pending.
    const head = await this.client.blockNumber();
    const depth = head - receipt.blockNumber + 1n;
    const status = depth >= BigInt(this.confirmations) ? 'confirmed' : 'pending';
    return { transactionHash: input.transactionHash, status, ledger: Number(receipt.blockNumber) };
  }

  /**
   * Enumerating an account's transfer history requires a log indexer on EVM. Unsupported in Phase 1
   * rather than silently returning [], which would let orphan reconciliation conclude "nothing to
   * reconcile" from missing data. The indexer-backed listener is Phase 2.
   */
  async getTransactionHistory(_input: GetHistoryInput): Promise<BlockchainTransaction[]> {
    throw new BlockchainProviderError(
      'getTransactionHistory is not supported on the EVM provider yet — it needs a log indexer (Phase 2).',
      'UNSUPPORTED',
      false,
    );
  }

  async estimateFee(input: EstimateFeeInput): Promise<FeeEstimate> {
    const gasPrice = await this.client.gasPrice();
    const ops = BigInt(input.operationCount ?? 1);
    return { fee: (gasPrice * GAS_PER_OP * ops).toString() };
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const [block, chainId] = await Promise.all([this.client.blockNumber(), this.client.chainId()]);
      return {
        healthy: true,
        network: this.cfg.network,
        latestLedger: Number(block),
        detail: `Base chainId=${chainId}`,
      };
    } catch (err) {
      return { healthy: false, network: this.cfg.network, detail: (err as Error).message };
    }
  }
}
