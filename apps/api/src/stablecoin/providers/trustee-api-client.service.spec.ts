import type { PayChainConfig } from '@paychain/config';
import { TrusteeApiClient } from './trustee-api-client.service';

const req = { reference: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', destination: 'w1' };

describe('TrusteeApiClient.requestMintAuthorization', () => {
  const cfg = (key: string) =>
    ({ TRUSTEE_API_BASE_URL: 'https://trustee.example', TRUSTEE_API_KEY: key } as unknown as PayChainConfig);

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockRestore?.();
  });

  it('skips (no throw) when no API key is configured', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;
    const out = await new TrusteeApiClient(cfg('')).requestMintAuthorization(req);
    expect(out).toEqual({ requested: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('POSTs with bearer + idempotency key on success', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock as never;
    const out = await new TrusteeApiClient(cfg('k')).requestMintAuthorization(req);
    expect(out).toEqual({ requested: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://trustee.example/api/v1/paychain/mint-authorizations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer k', 'Idempotency-Key': 'm1' }),
      }),
    );
  });

  it('returns requested:false (no throw) on an error response or network failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 }) as never;
    expect(await new TrusteeApiClient(cfg('k')).requestMintAuthorization(req)).toEqual({ requested: false });
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as never;
    expect(await new TrusteeApiClient(cfg('k')).requestMintAuthorization(req)).toEqual({ requested: false });
  });
});
