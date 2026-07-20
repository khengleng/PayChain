import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type Hex,
  type PublicClient,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { ERC20_ABI, type EvmChainClient, type EvmTxReceipt, type GeneratedAccount } from './client';

export interface ViemChainClientOptions {
  rpcUrl: string;
  /** 8453 = Base, 84532 = Base Sepolia. Selects the viem chain definition. */
  chainId: number;
}

function chainFor(chainId: number): Chain {
  if (chainId === base.id) return base;
  if (chainId === baseSepolia.id) return baseSepolia;
  throw new Error(`unsupported EVM chainId ${chainId} (expected ${base.id} Base or ${baseSepolia.id} Base Sepolia)`);
}

const asHex = (v: string): Hex => (v.startsWith('0x') ? (v as Hex) : (`0x${v}` as Hex));

/**
 * viem-backed EvmChainClient. This is the ONLY file in the codebase that imports viem — the same
 * boundary @paychain/stellar keeps around the Stellar SDK. All viem coupling lives here; the
 * EvmProvider depends only on the EvmChainClient port, so it stays unit-testable with a fake.
 *
 * Custodial signing: write methods build a wallet client from the caller-supplied private key
 * per call (accounts differ — minter for mint, the holder for burn/transfer), sign, and submit.
 */
export class ViemChainClient implements EvmChainClient {
  private readonly public: PublicClient;
  private readonly chain: Chain;

  constructor(private readonly opts: ViemChainClientOptions) {
    this.chain = chainFor(opts.chainId);
    this.public = createPublicClient({ chain: this.chain, transport: http(opts.rpcUrl) });
  }

  private wallet(secret: string) {
    return createWalletClient({
      account: privateKeyToAccount(asHex(secret)),
      chain: this.chain,
      transport: http(this.opts.rpcUrl),
    });
  }

  async chainId(): Promise<number> {
    return this.public.getChainId();
  }

  async blockNumber(): Promise<bigint> {
    return this.public.getBlockNumber();
  }

  async erc20Decimals(token: string): Promise<number> {
    const d = await this.public.readContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'decimals',
    });
    return Number(d);
  }

  async erc20BalanceOf(token: string, account: string): Promise<bigint> {
    return this.public.readContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [asHex(account)],
    }) as Promise<bigint>;
  }

  async erc20Mint(token: string, minterSecret: string, to: string, amount: bigint): Promise<string> {
    return this.wallet(minterSecret).writeContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [asHex(to), amount],
      chain: this.chain,
    } as never);
  }

  async erc20Transfer(token: string, fromSecret: string, to: string, amount: bigint): Promise<string> {
    return this.wallet(fromSecret).writeContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [asHex(to), amount],
      chain: this.chain,
    } as never);
  }

  async erc20Burn(token: string, fromSecret: string, amount: bigint): Promise<string> {
    return this.wallet(fromSecret).writeContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'burn',
      args: [amount],
      chain: this.chain,
    } as never);
  }

  async erc20Freeze(token: string, freezerSecret: string, account: string): Promise<string> {
    return this.wallet(freezerSecret).writeContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'freeze',
      args: [asHex(account)],
      chain: this.chain,
    } as never);
  }

  async erc20Unfreeze(token: string, freezerSecret: string, account: string): Promise<string> {
    return this.wallet(freezerSecret).writeContract({
      address: asHex(token),
      abi: ERC20_ABI,
      functionName: 'unfreeze',
      args: [asHex(account)],
      chain: this.chain,
    } as never);
  }

  async receipt(hash: string): Promise<EvmTxReceipt | null> {
    try {
      const r = await this.public.getTransactionReceipt({ hash: asHex(hash) });
      return { status: r.status, blockNumber: r.blockNumber };
    } catch {
      // Not yet mined / unknown hash — viem throws TransactionReceiptNotFoundError.
      return null;
    }
  }

  async nativeBalanceOf(account: string): Promise<bigint> {
    return this.public.getBalance({ address: asHex(account) });
  }

  async sendNative(fromSecret: string, to: string, valueWei: bigint): Promise<string> {
    return this.wallet(fromSecret).sendTransaction({
      to: asHex(to),
      value: valueWei,
      chain: this.chain,
    } as never);
  }

  async gasPrice(): Promise<bigint> {
    return this.public.getGasPrice();
  }

  addressFromSecret(secret: string): string {
    return privateKeyToAccount(asHex(secret)).address;
  }

  generateAccount(): GeneratedAccount {
    const privateKey = generatePrivateKey();
    return { address: privateKeyToAccount(privateKey).address, privateKey };
  }
}
