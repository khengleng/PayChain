import { StellarService } from './stellar.service';
import type { PayChainConfig } from '@paychain/config';

function build(overrides: Partial<PayChainConfig> = {}, chain?: Partial<{ healthCheck: jest.Mock; getBalance: jest.Mock }>) {
  const cfg = {
    STELLAR_NETWORK: 'testnet',
    STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    STELLAR_ASSET_CODE: 'PAYC',
    STELLAR_ASSET_ANCHORED: false,
    ADMIN_PORTAL_URL: 'https://paychain.cambobia.com',
    KEY_MANAGEMENT_PROVIDER: 'local-dev',
    STELLAR_ISSUER_PUBLIC_KEY: '',
    STELLAR_DISTRIBUTION_PUBLIC_KEY: '',
    ...overrides,
  } as PayChainConfig;
  const chainMock = {
    healthCheck: chain?.healthCheck ?? jest.fn().mockResolvedValue({ healthy: true, latestLedger: 555 }),
    getBalance: chain?.getBalance ?? jest.fn().mockResolvedValue([]),
  };
  return { svc: new StellarService(cfg, chainMock as never), chainMock };
}

describe('StellarService.health', () => {
  it('reports network, horizon connectivity and latest ledger', async () => {
    const { svc } = build();
    const h = await svc.health();
    expect(h).toMatchObject({ network: 'testnet', horizonConnected: true, latestLedger: 555, assetCode: 'PAYC' });
  });

  it('reports unconfigured accounts as null, configured+found as true, configured+missing as false', async () => {
    const getBalance = jest
      .fn()
      .mockResolvedValueOnce([]) // issuer exists
      .mockRejectedValueOnce(new Error('account not found')); // distribution missing
    const { svc } = build({ STELLAR_ISSUER_PUBLIC_KEY: 'GISSUER', STELLAR_DISTRIBUTION_PUBLIC_KEY: 'GDIST' }, { getBalance });
    const h = await svc.health();
    expect(h.issuerAccountAvailable).toBe(true);
    expect(h.distributionAccountAvailable).toBe(false);
  });

  it('null account availability when the key is unconfigured (no chain call)', async () => {
    const getBalance = jest.fn();
    const { svc } = build({}, { getBalance });
    const h = await svc.health();
    expect(h.issuerAccountAvailable).toBeNull();
    expect(getBalance).not.toHaveBeenCalled();
  });

  it('horizonConnected false when the provider health check throws', async () => {
    const healthCheck = jest.fn().mockRejectedValue(new Error('horizon down'));
    const { svc } = build({}, { healthCheck });
    const h = await svc.health();
    expect(h.horizonConnected).toBe(false);
    expect(h.latestLedger).toBeNull();
  });
});

describe('StellarService.buildStellarToml', () => {
  it('emits the passphrase, org and currency, and includes the issuer when configured', () => {
    const { svc } = build({ STELLAR_ISSUER_PUBLIC_KEY: 'GISSUER' });
    const toml = svc.buildStellarToml();
    expect(toml).toContain('NETWORK_PASSPHRASE="Test SDF Network ; September 2015"');
    expect(toml).toContain('code="PAYC"');
    expect(toml).toContain('issuer="GISSUER"');
  });

  it('OMITS any fiat-backing / anchor claim unless STELLAR_ASSET_ANCHORED is true', () => {
    const { svc } = build({ STELLAR_ASSET_ANCHORED: false });
    expect(svc.buildStellarToml()).not.toContain('is_asset_anchored');
  });

  it('asserts fiat anchoring only when explicitly enabled', () => {
    const { svc } = build({ STELLAR_ASSET_ANCHORED: true });
    const toml = svc.buildStellarToml();
    expect(toml).toContain('is_asset_anchored=true');
    expect(toml).toContain('anchor_asset="USD"');
  });
});
