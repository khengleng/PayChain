import 'reflect-metadata';

/**
 * Boots the real module graph.
 *
 * Typecheck and unit tests both pass happily while the Nest container is unresolvable: a DI
 * cycle or a provider exported from the wrong module only surfaces at boot. The e2e suite that
 * would have caught it is SKIPPED unless RUN_E2E=1, so in practice nothing checked this before
 * a deploy — the first thing to find out would have been production.
 *
 * compile() resolves every provider without running lifecycle hooks, so no database, Redis or
 * network is needed and this stays hermetic enough for CI.
 *
 * Runs under its own config with forceExit because constructing the graph opens Redis handles
 * that nothing closes. forceExit belongs HERE and not in the unit config, where it would hide
 * exactly this kind of leak in every other suite.
 */
describe('AppModule wiring', () => {
  const ENV = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-at-least-16-chars',
    KEY_ENCRYPTION_KEY: 'test-key-encryption-at-least-16',
    STELLAR_RPC_PRIMARY_URL: 'https://soroban-testnet.stellar.org',
    STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
    STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    STELLAR_NETWORK: 'testnet',
  };

  let saved: NodeJS.ProcessEnv;
  beforeAll(() => {
    saved = { ...process.env };
    Object.assign(process.env, ENV);
  });
  afterAll(() => {
    process.env = saved;
  });

  it('resolves every provider in the container', async () => {
    // Imported lazily so the env above is in place before config loads at module scope.
    const { Test } = await import('@nestjs/testing');
    const { AppModule } = await import('../src/app.module');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
