import { buildOpenApiSpec } from './openapi';

describe('buildOpenApiSpec', () => {
  it('publishes the public integration contract and core paths', () => {
    const spec = buildOpenApiSpec() as {
      openapi: string;
      paths: Record<string, unknown>;
      components: { securitySchemes: Record<string, unknown> };
    };

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.components.securitySchemes.oauth2ClientCredentials).toBeDefined();
    expect(spec.paths['/api/v1/oauth/token']).toBeDefined();
    expect(spec.paths['/api/v1/wallets']).toBeDefined();
    expect(spec.paths['/api/v1/assets/{assetId}/earn']).toBeDefined();
    expect(spec.paths['/api/v1/stablecoins/{stablecoinId}/approve-gate']).toBeDefined();
  });
});

