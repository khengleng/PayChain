import { signWebhook } from '@paychain/security';
import { PayChainClient } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('PayChainClient', () => {
  const opts = { baseUrl: 'https://api.test', clientId: 'c1', clientSecret: 's1' };

  it('authenticates once then reuses the token, and attaches an Idempotency-Key on writes', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(201, { id: 'w1' }))
      .mockResolvedValueOnce(jsonResponse(200, [{ assetCode: 'PTS', balance: '10' }]));
    const client = new PayChainClient({ ...opts, fetchImpl: fetchImpl as never });

    const created = await client.wallets.create({ ownerType: 'CUSTOMER', ownerReference: 'alice' });
    expect(created).toEqual({ id: 'w1' });

    // token call + create call
    const createCall = fetchImpl.mock.calls[1];
    expect(createCall[0]).toBe('https://api.test/api/v1/wallets');
    expect(createCall[1].headers['Idempotency-Key']).toBeTruthy();
    expect(createCall[1].headers['Authorization']).toBe('Bearer tok');

    // second call reuses token (no new token fetch)
    await client.wallets.balances('w1');
    const tokenCalls = fetchImpl.mock.calls.filter((c: unknown[]) => String(c[0]).endsWith('/oauth/token'));
    expect(tokenCalls).toHaveLength(1);
  });

  it('retries a transient 503 then succeeds', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(503, { error: 'busy' }))
      .mockResolvedValueOnce(jsonResponse(201, { id: 'a1' }));
    const client = new PayChainClient({ ...opts, fetchImpl: fetchImpl as never, maxRetries: 2 });

    const res = await client.assets.create({ assetCode: 'PTS', assetName: 'Points' });
    expect(res).toEqual({ id: 'a1' });
  });

  it('throws a typed error on a 4xx', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'tok', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse(400, { message: 'bad' }));
    const client = new PayChainClient({ ...opts, fetchImpl: fetchImpl as never });
    await expect(client.transactions.get('x')).rejects.toMatchObject({ status: 400 });
  });

  it('verifies a webhook signature', () => {
    const body = JSON.stringify({ event: 'asset.issued' });
    // Sign with the current time so the receiver's replay window accepts it.
    const { signature, timestamp } = signWebhook('whsec_1', body, Date.now());
    expect(PayChainClient.verifyWebhook('whsec_1', body, signature, timestamp)).toBe(true);
    expect(PayChainClient.verifyWebhook('wrong', body, signature, timestamp)).toBe(false);
  });
});
