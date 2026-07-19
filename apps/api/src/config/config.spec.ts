import { loadConfig, resetConfigCache, STELLAR_PASSPHRASES } from '@paychain/config';

const BASE = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'test-jwt-secret-at-least-16-chars',
  KEY_ENCRYPTION_KEY: 'test-key-encryption-at-least-16',
  STELLAR_RPC_PRIMARY_URL: 'https://soroban-testnet.stellar.org',
  STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
  STELLAR_NETWORK: 'testnet',
  STELLAR_NETWORK_PASSPHRASE: STELLAR_PASSPHRASES.testnet,
} as NodeJS.ProcessEnv;

// Sponsor keys satisfy the off-testnet funding rule so mainnet cases surface the mainnet/passphrase
// checks under test rather than the funding-path error.
const MAINNET = {
  ...BASE,
  STELLAR_NETWORK: 'mainnet',
  STELLAR_NETWORK_PASSPHRASE: STELLAR_PASSPHRASES.mainnet,
  STELLAR_HORIZON_URL: 'https://horizon.stellar.org',
  STELLAR_SPONSOR_PUBLIC_KEY: 'GSPONSORPUB',
  STELLAR_SPONSOR_SECRET_KEY: 'SSPONSORSEC',
} as NodeJS.ProcessEnv;

beforeEach(() => resetConfigCache());

describe('config — Stellar network safety (mainnet-readiness)', () => {
  it('accepts testnet with the canonical passphrase (unchanged behaviour)', () => {
    const cfg = loadConfig(BASE);
    expect(cfg.STELLAR_NETWORK).toBe('testnet');
    expect(cfg.STELLAR_ASSET_CODE).toBe('PAYC'); // default
    expect(cfg.STELLAR_ASSET_ANCHORED).toBe(false); // default: no fiat-backing claim
  });

  it('REJECTS a passphrase that does not match the selected network', () => {
    expect(() =>
      loadConfig({ ...BASE, STELLAR_NETWORK_PASSPHRASE: STELLAR_PASSPHRASES.mainnet }),
    ).toThrow(/does not match STELLAR_NETWORK='testnet'/);
  });

  it('REJECTS mainnet on the in-process dev signer (fail-closed)', () => {
    // KEY_MANAGEMENT_PROVIDER defaults to 'local-dev' → mainnet must refuse to boot.
    expect(() => loadConfig(MAINNET)).toThrow(/mainnet requires an external HSM\/KMS signer/);
  });

  it('still REJECTS mainnet with kms (no signer implemented yet — doubly blocked in Phase 0)', () => {
    expect(() => loadConfig({ ...MAINNET, KEY_MANAGEMENT_PROVIDER: 'kms' })).toThrow(/not implemented/);
  });

  it('REJECTS mainnet with a non-mainnet passphrase', () => {
    expect(() =>
      loadConfig({ ...MAINNET, STELLAR_NETWORK_PASSPHRASE: STELLAR_PASSPHRASES.testnet }),
    ).toThrow(/does not match STELLAR_NETWORK='mainnet'/);
  });

  it('REJECTS a half-configured Bakong bank feed (url without key or vice versa)', () => {
    expect(() => loadConfig({ ...BASE, BAKONG_API_BASE_URL: 'https://bakong.test' })).toThrow(/set together/);
    expect(() => loadConfig({ ...BASE, BAKONG_API_KEY: 'k' })).toThrow(/set together/);
    // Both set is accepted.
    expect(() => loadConfig({ ...BASE, BAKONG_API_BASE_URL: 'https://bakong.test', BAKONG_API_KEY: 'k' })).not.toThrow();
  });

  it('parses the optional Stellar identity vars', () => {
    const cfg = loadConfig({
      ...BASE,
      STELLAR_ISSUER_PUBLIC_KEY: 'GISSUER',
      STELLAR_DISTRIBUTION_PUBLIC_KEY: 'GDIST',
      STELLAR_ASSET_CODE: 'PAYC',
      STELLAR_ASSET_ANCHORED: 'true',
    });
    expect(cfg.STELLAR_ISSUER_PUBLIC_KEY).toBe('GISSUER');
    expect(cfg.STELLAR_DISTRIBUTION_PUBLIC_KEY).toBe('GDIST');
    expect(cfg.STELLAR_ASSET_ANCHORED).toBe(true);
  });
});
