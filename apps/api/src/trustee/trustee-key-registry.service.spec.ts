import { generateKeyPairSync } from 'node:crypto';
import type { PayChainConfig } from '@paychain/config';
import { TrusteeKeyRegistry, type JwksFetcher } from './trustee-key-registry.service';

describe('TrusteeKeyRegistry', () => {
  const webhook = generateKeyPairSync('ed25519');
  const mintAuth = generateKeyPairSync('ed25519');
  const pem = (kp: ReturnType<typeof generateKeyPairSync>) =>
    kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();

  const JWKS = {
    keys: [
      { purpose: 'WEBHOOK', keyId: 'webhook-v1', publicKeyPem: pem(webhook) },
      { purpose: 'MINT_AUTHORIZATION', keyId: 'mint_authorization-v1', publicKeyPem: pem(mintAuth) },
    ],
  };

  const cfg = (over: Partial<PayChainConfig> = {}) =>
    ({
      TRUSTEE_JWKS_URL: 'https://trustee.example/.well-known/keys',
      TRUSTEE_WEBHOOK_KEY_ID: 'webhook-v1',
      TRUSTEE_WEBHOOK_PUBLIC_KEY: '',
      ...over,
    }) as unknown as PayChainConfig;

  it('fetches and resolves a purpose key by keyId', async () => {
    const fetcher = jest.fn<ReturnType<JwksFetcher>, Parameters<JwksFetcher>>().mockResolvedValue(JWKS);
    const reg = new TrusteeKeyRegistry(cfg(), fetcher);
    expect(await reg.getKey('MINT_AUTHORIZATION', 'mint_authorization-v1')).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('caches: a second lookup does not refetch', async () => {
    const fetcher = jest.fn<ReturnType<JwksFetcher>, Parameters<JwksFetcher>>().mockResolvedValue(JWKS);
    const reg = new TrusteeKeyRegistry(cfg(), fetcher);
    await reg.getKey('WEBHOOK', 'webhook-v1');
    await reg.getKey('WEBHOOK', 'webhook-v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('forces one refresh on an unknown keyId (rotation), then rejects if still missing', async () => {
    const fetcher = jest.fn<ReturnType<JwksFetcher>, Parameters<JwksFetcher>>().mockResolvedValue(JWKS);
    const reg = new TrusteeKeyRegistry(cfg(), fetcher);
    await reg.getKey('WEBHOOK', 'webhook-v1'); // populate (1 fetch)
    expect(await reg.getKey('WEBHOOK', 'webhook-v2')).toBeNull(); // miss → 1 forced refresh
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('falls back to the pinned webhook key when the JWKS is unreachable', async () => {
    const fetcher = jest.fn<ReturnType<JwksFetcher>, Parameters<JwksFetcher>>().mockRejectedValue(new Error('down'));
    const reg = new TrusteeKeyRegistry(cfg({ TRUSTEE_WEBHOOK_PUBLIC_KEY: pem(webhook) }), fetcher);
    // getKey for WEBHOOK with the pinned key id returns the pinned key despite the fetch failing.
    expect(await reg.getKey('WEBHOOK', 'webhook-v1')).not.toBeNull();
    expect(await reg.hasWebhookKeys()).toBe(true);
  });

  it('hasWebhookKeys is false when neither JWKS nor a pinned key is available', async () => {
    const fetcher = jest.fn<ReturnType<JwksFetcher>, Parameters<JwksFetcher>>().mockResolvedValue({ keys: [] });
    const reg = new TrusteeKeyRegistry(cfg(), fetcher);
    expect(await reg.hasWebhookKeys()).toBe(false);
    expect(await reg.getKey('MINT_AUTHORIZATION', 'mint_authorization-v1')).toBeNull();
  });
});
