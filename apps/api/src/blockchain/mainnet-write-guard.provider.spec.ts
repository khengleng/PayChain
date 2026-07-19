import { MainnetWriteGuardProvider } from './mainnet-write-guard.provider';
import type { NetworkName } from '@paychain/blockchain';

function fakeDelegate() {
  const ok = { transactionHash: 'H', submitted: true };
  return {
    issueAsset: jest.fn().mockResolvedValue(ok),
    transferAsset: jest.fn().mockResolvedValue(ok),
    redeemAsset: jest.fn().mockResolvedValue(ok),
    burnAsset: jest.fn().mockResolvedValue(ok),
    createWallet: jest.fn().mockResolvedValue({ publicKey: 'G', secretKey: 'S', funded: true }),
    establishTrustline: jest.fn().mockResolvedValue({ transactionHash: 'T' }),
    freezeWallet: jest.fn().mockResolvedValue(ok),
    unfreezeWallet: jest.fn().mockResolvedValue(ok),
    getBalance: jest.fn().mockResolvedValue([]),
    getTransaction: jest.fn().mockResolvedValue({ transactionHash: 'H', status: 'confirmed' }),
    getTransactionHistory: jest.fn().mockResolvedValue([]),
    createAsset: jest.fn(),
    estimateFee: jest.fn().mockResolvedValue({ fee: '100' }),
    healthCheck: jest.fn().mockResolvedValue({ healthy: true, network: 'mainnet' }),
  };
}

const guard = (network: NetworkName, enabled: boolean, delegate = fakeDelegate()) => ({
  delegate,
  provider: new MainnetWriteGuardProvider(delegate as never, network, async () => enabled),
});

const anyInput = {} as never;

describe('MainnetWriteGuardProvider', () => {
  it('off mainnet: value writes pass through without checking the flag', async () => {
    const flag = jest.fn().mockResolvedValue(false);
    const delegate = fakeDelegate();
    const p = new MainnetWriteGuardProvider(delegate as never, 'testnet', flag);
    await expect(p.issueAsset(anyInput)).resolves.toBeDefined();
    await expect(p.burnAsset(anyInput)).resolves.toBeDefined();
    expect(flag).not.toHaveBeenCalled(); // no gate off mainnet
    expect(delegate.issueAsset).toHaveBeenCalled();
  });

  it('mainnet + flag OFF: refuses issue/transfer/redeem/burn and does not touch the delegate', async () => {
    const { provider, delegate } = guard('mainnet', false);
    for (const op of ['issueAsset', 'transferAsset', 'redeemAsset', 'burnAsset'] as const) {
      await expect(provider[op](anyInput)).rejects.toThrow(/Mainnet writes are disabled/);
      expect(delegate[op]).not.toHaveBeenCalled();
    }
  });

  it('mainnet + flag ON: value writes are allowed through', async () => {
    const { provider, delegate } = guard('mainnet', true);
    await expect(provider.issueAsset(anyInput)).resolves.toBeDefined();
    expect(delegate.issueAsset).toHaveBeenCalled();
  });

  it('mainnet: reads and account/control ops are NEVER gated (a freeze must work when writes are paused)', async () => {
    const { provider, delegate } = guard('mainnet', false);
    await expect(provider.getBalance(anyInput)).resolves.toBeDefined();
    await expect(provider.freezeWallet(anyInput)).resolves.toBeDefined();
    await expect(provider.createWallet(anyInput)).resolves.toBeDefined();
    await expect(provider.healthCheck()).resolves.toBeDefined();
    expect(delegate.getBalance).toHaveBeenCalled();
    expect(delegate.freezeWallet).toHaveBeenCalled();
  });
});
