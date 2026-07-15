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
  it('fails over to the secondary when the primary errors', async () => {
    const provider = new FailoverBlockchainProvider([
      { name: 'primary', provider: flaky(true) },
      { name: 'secondary', provider: new MockBlockchainProvider() },
    ]);
    const wallet = await provider.createWallet({ correlationId: 'c1' });
    expect(wallet.publicKey).toMatch(/^GMOCK/); // served by the secondary
  });

  it('throws a single retryable error when all providers fail', async () => {
    const provider = new FailoverBlockchainProvider([
      { name: 'primary', provider: flaky(true) },
      { name: 'secondary', provider: flaky(true) },
    ]);
    await expect(provider.createWallet({ correlationId: 'c1' })).rejects.toMatchObject({
      code: 'ALL_PROVIDERS_FAILED',
      retryable: true,
    });
  });

  it('opens the primary circuit and keeps serving from the secondary', async () => {
    const provider = new FailoverBlockchainProvider(
      [
        { name: 'primary', provider: flaky(true) },
        { name: 'secondary', provider: new MockBlockchainProvider() },
      ],
      { circuit: { failureThreshold: 1, resetTimeoutMs: 10_000 } },
    );
    // First call trips the primary breaker; subsequent calls skip it and hit the secondary.
    for (let i = 0; i < 3; i += 1) {
      const w = await provider.createWallet({ correlationId: `c${i}` });
      expect(w.funded).toBe(true);
    }
  });
});
