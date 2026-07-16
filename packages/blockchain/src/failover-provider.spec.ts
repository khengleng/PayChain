import { FailoverBlockchainProvider } from './failover-provider';
import { MockBlockchainProvider } from './mock-provider';
import type { BlockchainProvider } from './provider';

function flaky(fail: boolean): BlockchainProvider {
  const base = new MockBlockchainProvider();
  return new Proxy(base, {
    get(target, prop) {
      if (prop === 'healthCheck') return () => Promise.resolve({ healthy: !fail, network: 'testnet' as const });
      const orig = Reflect.get(target, prop);
      if (typeof orig === 'function' && prop !== 'constructor') {
        return (...args: unknown[]) =>
          fail ? Promise.reject(new Error('primary down')) : (orig as (...a: unknown[]) => unknown).apply(target, args);
      }
      return orig;
    },
  }) as BlockchainProvider;
}

describe('FailoverBlockchainProvider', () => {
  it('fails over reads to the secondary when the primary errors', async () => {
    const provider = new FailoverBlockchainProvider([
      { name: 'primary', provider: flaky(true) },
      { name: 'secondary', provider: new MockBlockchainProvider() },
    ]);
    // getBalance is a read → safe to fail over.
    await expect(provider.getBalance({ publicKey: 'GX' })).resolves.toEqual([]);
  });

  it('throws a single retryable error when all providers fail (read)', async () => {
    const provider = new FailoverBlockchainProvider([
      { name: 'primary', provider: flaky(true) },
      { name: 'secondary', provider: flaky(true) },
    ]);
    await expect(provider.getBalance({ publicKey: 'GX' })).rejects.toMatchObject({
      code: 'ALL_PROVIDERS_FAILED',
      retryable: true,
    });
  });

  it('does NOT fail over a write on a generic error (may have been submitted)', async () => {
    const secondary = new MockBlockchainProvider();
    const spy = jest.spyOn(secondary, 'issueAsset');
    const provider = new FailoverBlockchainProvider([
      { name: 'primary', provider: flaky(true) },
      { name: 'secondary', provider: secondary },
    ]);
    await expect(
      provider.issueAsset({
        correlationId: 'c', assetCode: 'PTS', issuerPublicKey: 'GI', issuerSecretKey: 'S',
        destinationPublicKey: 'GD', amount: '10',
      }),
    ).rejects.toMatchObject({ code: 'WRITE_NOT_RETRYABLE' });
    expect(spy).not.toHaveBeenCalled(); // never re-submitted to the secondary
  });

  it('fails over a write to the secondary once the primary circuit is OPEN', async () => {
    const provider = new FailoverBlockchainProvider(
      [
        { name: 'primary', provider: flaky(true) },
        { name: 'secondary', provider: new MockBlockchainProvider() },
      ],
      { circuit: { failureThreshold: 1, resetTimeoutMs: 10_000 } },
    );
    // First write trips the primary breaker AND is not retried (throws).
    await expect(provider.createWallet({ correlationId: 'c1' })).rejects.toBeDefined();
    // Now the primary circuit is OPEN (never sends), so the write safely fails over.
    const w = await provider.createWallet({ correlationId: 'c2' });
    expect(w.funded).toBe(true);
  });
});
