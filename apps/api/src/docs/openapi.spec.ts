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

  /**
   * The contract once advertised the reserve-backed mint shape on the rules-engine path, so a caller
   * following the docs sent fields the live handler never reads. Pin each earn product to the path,
   * scope and body its controller actually serves.
   */
  describe('the two earn products', () => {
    interface Operation {
      security: Array<{ oauth2ClientCredentials?: string[] }>;
      requestBody: { content: { 'application/json': { schema: { $ref: string } } } };
    }
    const spec = buildOpenApiSpec() as {
      paths: Record<string, { post?: Operation } | undefined>;
      components: { schemas: Record<string, { required?: string[] } | undefined> };
    };

    function operation(path: string): Operation {
      const post = spec.paths[path]?.post;
      if (!post) throw new Error(`No POST published at ${path}`);
      return post;
    }
    const bodyRef = (path: string) => operation(path).requestBody.content['application/json'].schema.$ref;
    const scopes = (path: string) => operation(path).security[0]?.oauth2ClientCredentials;
    const required = (schema: string) => spec.components.schemas[schema]?.required;

    it('serves the rules engine on /assets/{assetId}/earn with the purchase shape', () => {
      expect(bodyRef('/api/v1/assets/{assetId}/earn')).toBe('#/components/schemas/EarnRequest');
      expect(required('EarnRequest')).toEqual(['walletId', 'spendAmount', 'currency']);
      expect(scopes('/api/v1/assets/{assetId}/earn')).toEqual(['asset.issue']);
    });

    it('serves the reserve-backed mint on /stablecoins/{assetId}/earn with the mint shape', () => {
      expect(bodyRef('/api/v1/stablecoins/{assetId}/earn')).toBe('#/components/schemas/StablecoinEarnRequest');
      expect(required('StablecoinEarnRequest')).toEqual(['destinationWalletId', 'amount']);
      expect(scopes('/api/v1/stablecoins/{assetId}/earn')).toEqual(['stablecoin.earn']);
    });
  });
});

