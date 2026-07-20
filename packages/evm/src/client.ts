import type { NetworkName } from '@paychain/blockchain';

/**
 * Minimal ERC-20 ABI PayChain needs: read balance/decimals, move/mint/burn supply. `mint` is the
 * MINTER_ROLE method on PayChainToken; `burn` is ERC20Burnable's holder-burn.
 */
export const ERC20_ABI = [
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'burn',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'freeze',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unfreeze',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [],
  },
] as const;

/** A newly generated custodial account: PayChain holds both, exactly as with Stellar wallets. */
export interface GeneratedAccount {
  address: string;
  privateKey: string;
}

export interface EvmTxReceipt {
  status: 'success' | 'reverted';
  blockNumber: bigint;
}

/** A decoded ERC-20 Transfer log — the unit getTransactionHistory reconstructs account activity from. */
export interface TransferLog {
  transactionHash: string;
  blockNumber: bigint;
  from: string;
  to: string;
  value: bigint;
}

/**
 * The narrow chain port the EvmProvider depends on. The viem-backed implementation
 * (ViemChainClient) is the ONLY place in the codebase that imports viem — analogous to
 * @paychain/stellar being the only importer of the Stellar SDK. Tests inject a fake.
 *
 * Custodial signing: write methods take the signer's 0x private key inline (the same trust model as
 * the Stellar provider decrypting stellarSecretEnc). Swapping this for an HSM/KMS EVM signer is the
 * Base-mainnet prerequisite the config gate enforces.
 */
export interface EvmChainClient {
  chainId(): Promise<number>;
  blockNumber(): Promise<bigint>;
  erc20Decimals(token: string): Promise<number>;
  erc20BalanceOf(token: string, account: string): Promise<bigint>;
  /** MINTER_ROLE mint(to, amount). Reserve-gated off-chain before this is ever called. */
  erc20Mint(token: string, minterSecret: string, to: string, amount: bigint): Promise<string>;
  erc20Transfer(token: string, fromSecret: string, to: string, amount: bigint): Promise<string>;
  /** ERC20Burnable burn(amount) from the holder — drops supply. */
  erc20Burn(token: string, fromSecret: string, amount: bigint): Promise<string>;
  /** freeze(account)/unfreeze(account) — FREEZER_ROLE, signed with the platform freezer key. */
  erc20Freeze(token: string, freezerSecret: string, account: string): Promise<string>;
  erc20Unfreeze(token: string, freezerSecret: string, account: string): Promise<string>;
  receipt(hash: string): Promise<EvmTxReceipt | null>;
  /**
   * ERC-20 Transfer logs for `token` in [fromBlock, toBlock] matching the (indexed) from/to filter.
   * `from`+`to` together would AND them; the provider issues two calls (one per direction) and merges.
   */
  erc20TransferLogs(
    token: string,
    filter: { from?: string; to?: string },
    fromBlock: bigint,
    toBlock: bigint,
  ): Promise<TransferLog[]>;
  nativeBalanceOf(account: string): Promise<bigint>;
  sendNative(fromSecret: string, to: string, valueWei: bigint): Promise<string>;
  gasPrice(): Promise<bigint>;
  /** Derive the 0x address for a private key (address == "public key" in domain terms). */
  addressFromSecret(secret: string): string;
  generateAccount(): GeneratedAccount;
}

/** A token the provider can report a balance for (getBalance takes only an account, not a token). */
export interface KnownToken {
  address: string;
  assetCode: string;
}

/**
 * The set of tokens getBalance enumerates. Either a static list (configured platform coins) or a
 * resolver evaluated per call — the seam for backing it with the EVM Asset rows in the DB so that
 * dynamically-provisioned merchant coins are enumerated without re-wiring the provider.
 */
export type KnownTokenSource = KnownToken[] | (() => Promise<KnownToken[]>);

/**
 * Combine the primary configured coin with any additional configured coins into a deduped list
 * (by lowercased address). Shared by the API and worker wiring so getBalance enumerates the same
 * token set on both.
 */
export function mergeKnownTokens(
  primaryAddress: string | undefined,
  primaryCode: string,
  additional: KnownToken[],
): KnownToken[] {
  const seen = new Map<string, KnownToken>();
  const add = (t: KnownToken) => {
    if (t.address) seen.set(t.address.toLowerCase(), t);
  };
  if (primaryAddress) add({ address: primaryAddress, assetCode: primaryCode });
  additional.forEach(add);
  return [...seen.values()];
}

export interface EvmProviderConfig {
  /** 'testnet' = Base Sepolia, 'mainnet' = Base. Reported in ProviderHealth. */
  network: NetworkName;
  client: EvmChainClient;
  /**
   * Tokens getBalance enumerates for an account. EVM has no on-chain trustline list, so the provider
   * reports balances for the token contracts it is told about — a configured list, or a resolver
   * (e.g. backed by the EVM Asset rows) for dynamically-provisioned coins.
   */
  knownTokens?: KnownTokenSource;
  /** Block confirmations before getTransaction reports 'confirmed'. */
  confirmations?: number;
  /**
   * getTransactionHistory scans this many blocks back from head (bounded so a stateless call cannot
   * scan from genesis), in chunks of `logChunkBlocks` (RPCs cap eth_getLogs ranges). Newest chunk
   * first, stopping once `limit` results are collected — recent activity is what orphan recon needs.
   */
  historyWindowBlocks?: number;
  logChunkBlocks?: number;
  /** Optional gas-funder: drips native ETH to each new custodial account so it can pay its own gas. */
  gasFunderSecretKey?: string;
  gasDripWei?: bigint;
}
