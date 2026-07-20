import { BlockchainProviderError } from '@paychain/blockchain';
import type { EvmChainClient, EvmTxReceipt } from './client';
import { EvmProvider } from './evm-provider';

const TOKEN = '0xTokenContract';
const MINTER = '0xmintersecret';

/** In-memory EvmChainClient: records write calls and returns canned reads. */
class FakeClient implements EvmChainClient {
  decimals = 7;
  head = 100n;
  balances = new Map<string, bigint>();
  receipts = new Map<string, EvmTxReceipt | null>();
  sentNative: Array<{ from: string; to: string; value: bigint }> = [];
  mints: Array<{ token: string; minter: string; to: string; amount: bigint }> = [];
  transfers: Array<{ token: string; from: string; to: string; amount: bigint }> = [];
  burns: Array<{ token: string; from: string; amount: bigint }> = [];
  private seq = 0;

  async chainId() {
    return 84532;
  }
  async blockNumber() {
    return this.head;
  }
  async erc20Decimals() {
    return this.decimals;
  }
  async erc20BalanceOf(_token: string, account: string) {
    return this.balances.get(account) ?? 0n;
  }
  async erc20Mint(token: string, minter: string, to: string, amount: bigint) {
    this.mints.push({ token, minter, to, amount });
    return `0xmint${this.seq++}`;
  }
  async erc20Transfer(token: string, from: string, to: string, amount: bigint) {
    this.transfers.push({ token, from, to, amount });
    return `0xxfer${this.seq++}`;
  }
  async erc20Burn(token: string, from: string, amount: bigint) {
    this.burns.push({ token, from, amount });
    return `0xburn${this.seq++}`;
  }
  async receipt(hash: string) {
    return this.receipts.get(hash) ?? null;
  }
  async nativeBalanceOf() {
    return 0n;
  }
  async sendNative(from: string, to: string, value: bigint) {
    this.sentNative.push({ from, to, value });
    return `0xnative${this.seq++}`;
  }
  async gasPrice() {
    return 1_000_000_000n; // 1 gwei
  }
  addressFromSecret(secret: string) {
    return `0xaddr(${secret})`;
  }
  generateAccount() {
    const n = this.seq++;
    return { address: `0xnew${n}`, privateKey: `0xkey${n}` };
  }
}

function makeProvider(client: FakeClient, overrides = {}) {
  return new EvmProvider({
    network: 'testnet',
    client,
    knownTokens: [{ address: TOKEN, assetCode: 'PKHPTS' }],
    confirmations: 2,
    ...overrides,
  });
}

describe('EvmProvider (custodial Base)', () => {
  it('createWallet generates an account and drips gas when a funder is configured', async () => {
    const client = new FakeClient();
    const provider = makeProvider(client, { gasFunderSecretKey: '0xfunder', gasDripWei: 5_000n });
    const res = await provider.createWallet({ correlationId: 'c1' });
    expect(res.publicKey).toMatch(/^0xnew/);
    expect(res.secretKey).toMatch(/^0xkey/);
    expect(res.funded).toBe(true);
    expect(client.sentNative).toEqual([{ from: '0xfunder', to: res.publicKey, value: 5_000n }]);
  });

  it('createWallet reports unfunded (not failed) when no gas funder is set', async () => {
    const client = new FakeClient();
    const res = await makeProvider(client).createWallet({ correlationId: 'c1' });
    expect(res.funded).toBe(false);
    expect(client.sentNative).toHaveLength(0);
  });

  it('issueAsset mints to the destination converting decimals to base units', async () => {
    const client = new FakeClient();
    const res = await makeProvider(client).issueAsset({
      correlationId: 'c1',
      assetCode: 'PKHPTS',
      issuerPublicKey: TOKEN,
      issuerSecretKey: MINTER,
      destinationPublicKey: '0xcustomer',
      amount: '500',
    });
    expect(res).toEqual({ transactionHash: expect.stringMatching(/^0xmint/), submitted: true });
    expect(client.mints).toEqual([{ token: TOKEN, minter: MINTER, to: '0xcustomer', amount: 5_000_000_000n }]);
  });

  it('burnAsset and redeemAsset both burn from the holder (supply drops)', async () => {
    const client = new FakeClient();
    const provider = makeProvider(client);
    await provider.burnAsset({
      correlationId: 'c1',
      assetCode: 'PKHPTS',
      issuerPublicKey: TOKEN,
      holderPublicKey: '0xh',
      holderSecretKey: '0xhs',
      amount: '1',
    });
    await provider.redeemAsset({
      correlationId: 'c2',
      assetCode: 'PKHPTS',
      issuerPublicKey: TOKEN,
      sourcePublicKey: '0xh',
      sourceSecretKey: '0xhs',
      amount: '2',
    });
    expect(client.burns).toEqual([
      { token: TOKEN, from: '0xhs', amount: 10_000_000n },
      { token: TOKEN, from: '0xhs', amount: 20_000_000n },
    ]);
  });

  it('getBalance reports configured known tokens formatted back to a decimal string', async () => {
    const client = new FakeClient();
    client.balances.set('0xcustomer', 5_000_000_000n);
    const balances = await makeProvider(client).getBalance({ publicKey: '0xcustomer' });
    expect(balances).toEqual([{ assetCode: 'PKHPTS', issuerPublicKey: TOKEN, balance: '500' }]);
  });

  it('getTransaction is pending until confirmations, then confirmed; reverted → failed; missing → not_found', async () => {
    const client = new FakeClient();
    const provider = makeProvider(client);
    client.head = 100n;

    client.receipts.set('0xpending', { status: 'success', blockNumber: 100n }); // depth 1 < 2
    expect((await provider.getTransaction({ transactionHash: '0xpending' })).status).toBe('pending');

    client.receipts.set('0xdone', { status: 'success', blockNumber: 99n }); // depth 2 >= 2
    expect((await provider.getTransaction({ transactionHash: '0xdone' })).status).toBe('confirmed');

    client.receipts.set('0xrevert', { status: 'reverted', blockNumber: 99n });
    expect((await provider.getTransaction({ transactionHash: '0xrevert' })).status).toBe('failed');

    expect((await provider.getTransaction({ transactionHash: '0xunknown' })).status).toBe('not_found');
  });

  it('establishTrustline and freeze/unfreeze are no-ops (no on-chain trustline / freeze on plain ERC-20)', async () => {
    const provider = makeProvider(new FakeClient());
    expect(await provider.establishTrustline({
      correlationId: 'c1',
      accountPublicKey: '0xa',
      accountSecretKey: '0xas',
      assetCode: 'PKHPTS',
      issuerPublicKey: TOKEN,
    })).toEqual({ transactionHash: 'evm:no-trustline-required' });
    const frozen = await provider.freezeWallet({
      correlationId: 'c1',
      assetCode: 'PKHPTS',
      issuerPublicKey: TOKEN,
      issuerSecretKey: MINTER,
      targetPublicKey: '0xa',
    });
    expect(frozen.submitted).toBe(false);
  });

  it('getTransactionHistory is explicitly unsupported (needs an indexer) rather than silently empty', async () => {
    await expect(makeProvider(new FakeClient()).getTransactionHistory({ publicKey: '0xa' })).rejects.toBeInstanceOf(
      BlockchainProviderError,
    );
  });

  it('healthCheck reports the block height and chain id', async () => {
    const health = await makeProvider(new FakeClient()).healthCheck();
    expect(health.healthy).toBe(true);
    expect(health.network).toBe('testnet');
    expect(health.latestLedger).toBe(100);
  });
});
