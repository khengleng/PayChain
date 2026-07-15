import { PayKhPayChainAdapter, PayKhIntegrationError, type PayChainClientLike } from './adapter';

const cfg = {
  baseUrl: 'https://api.test',
  clientId: 'c',
  clientSecret: 's',
  loyaltyAssetId: 'asset-1',
  loyaltyAssetCode: 'PTS',
};

function mockClient(overrides: Partial<{ earn: jest.Mock; issue: jest.Mock; redeem: jest.Mock; balances: jest.Mock; create: jest.Mock }> = {}): PayChainClientLike {
  return {
    wallets: {
      create: overrides.create ?? jest.fn().mockResolvedValue({ id: 'w1', stellarAccountId: 'G', status: 'ACTIVE' }),
      get: jest.fn(),
      balances: overrides.balances ?? jest.fn().mockResolvedValue([{ assetCode: 'PTS', balance: '150' }]),
    },
    assets: {
      issue: overrides.issue ?? jest.fn().mockResolvedValue({ id: 'tx1', status: 'CONFIRMED', blockchainHash: 'H' }),
      transfer: jest.fn().mockResolvedValue({ id: 'tx2', status: 'CONFIRMED', blockchainHash: 'H' }),
      redeem: overrides.redeem ?? jest.fn().mockResolvedValue({ id: 'tx3', status: 'CONFIRMED', blockchainHash: 'H' }),
      earn: overrides.earn ?? jest.fn().mockResolvedValue({ points: '50', appliedRules: ['base'], transaction: { id: 'tx4', status: 'CONFIRMED', blockchainHash: 'H' } }),
    },
    transactions: { get: jest.fn().mockResolvedValue({ id: 'tx1', status: 'CONFIRMED', blockchainHash: 'H' }) },
  };
}

describe('PayKhPayChainAdapter (loyalty-only)', () => {
  it('creates a wallet with a deterministic idempotency key per customer', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'w1', stellarAccountId: 'G', status: 'ACTIVE' });
    const adapter = new PayKhPayChainAdapter(cfg, mockClient({ create }));
    await adapter.ensureCustomerWallet('cust-42');
    expect(create).toHaveBeenCalledWith(
      { ownerType: 'CUSTOMER', ownerReference: 'paykh:cust-42' },
      'paykh:wallet:cust-42',
    );
  });

  it('awards a purchase reward via the rules engine with an event-keyed idempotency key', async () => {
    const earn = jest.fn().mockResolvedValue({ points: '50', appliedRules: ['base'], transaction: { id: 'tx4' } });
    const adapter = new PayKhPayChainAdapter(cfg, mockClient({ earn }));
    const res = await adapter.awardPurchaseReward({ eventId: 'evt-9', walletId: 'w1', spendAmount: '5', currency: 'USD' });
    expect(res.points).toBe('50');
    expect(earn).toHaveBeenCalledWith('asset-1', expect.objectContaining({ walletId: 'w1', spendAmount: '5' }), 'paykh:earn:evt-9');
  });

  it('uses distinct deterministic keys for referral and scratch-game rewards', async () => {
    const issue = jest.fn().mockResolvedValue({ id: 'tx', status: 'CONFIRMED', blockchainHash: 'H' });
    const adapter = new PayKhPayChainAdapter(cfg, mockClient({ issue }));
    await adapter.awardReferralReward({ eventId: 'r1', walletId: 'w1', points: '20' });
    await adapter.awardScratchGameReward({ playId: 'p1', walletId: 'w1', points: '5' });
    expect(issue).toHaveBeenNthCalledWith(1, 'asset-1', { destinationWalletId: 'w1', amount: '20' }, 'paykh:referral:r1');
    expect(issue).toHaveBeenNthCalledWith(2, 'asset-1', { destinationWalletId: 'w1', amount: '5' }, 'paykh:scratch:p1');
  });

  it('reads the loyalty-point balance for the configured asset code', async () => {
    const adapter = new PayKhPayChainAdapter(cfg, mockClient());
    expect(await adapter.getPointsBalance('w1')).toBe('150');
  });

  it('wraps SDK errors with PayKH context', async () => {
    const redeem = jest.fn().mockRejectedValue(new Error('boom'));
    const adapter = new PayKhPayChainAdapter(cfg, mockClient({ redeem }));
    await expect(adapter.redeemPoints({ eventId: 'e', walletId: 'w1', points: '10' })).rejects.toBeInstanceOf(
      PayKhIntegrationError,
    );
  });
});
