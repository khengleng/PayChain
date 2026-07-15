import { signWebhook, verifyWebhook } from './webhook-signature';

describe('webhook signature', () => {
  const secret = 'whsec_test_1234567890';
  const body = JSON.stringify({ event: 'asset.issued', amount: '100' });
  const now = 1_700_000_000_000;

  it('produces a verifiable signature', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    expect(signature.startsWith('sha256=')).toBe(true);
    expect(verifyWebhook(secret, body, signature, timestamp, undefined, now)).toBe(true);
  });

  it('rejects a tampered body', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    expect(verifyWebhook(secret, body + 'x', signature, timestamp, undefined, now)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    expect(verifyWebhook('other', body, signature, timestamp, undefined, now)).toBe(false);
  });

  it('rejects a stale timestamp (replay protection)', () => {
    const { signature, timestamp } = signWebhook(secret, body, now);
    const later = now + 10 * 60 * 1000; // 10 min later, tolerance 5 min
    expect(verifyWebhook(secret, body, signature, timestamp, undefined, later)).toBe(false);
  });
});
