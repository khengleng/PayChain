import { SymmetricCrypto } from '@paychain/security';
import { WebhookDeliveryService, type DeliveryRecord } from './webhook-delivery.service';

describe('WebhookDeliveryService', () => {
  const crypto = new SymmetricCrypto('test-encryption-key-at-least-16');
  const secretEnc = crypto.encrypt('whsec_abc123');

  function delivery(attempts = 0): DeliveryRecord {
    return {
      id: 'd1',
      eventType: 'asset.issued',
      payload: { amount: '100' },
      attempts,
      endpoint: { url: 'https://example.test/hook', secretEnc },
    };
  }

  function build(httpPost: jest.Mock, update: jest.Mock, maxAttempts = 6) {
    const prisma = { webhookDelivery: { findMany: jest.fn(), update } } as never;
    return new WebhookDeliveryService(prisma, crypto, httpPost, maxAttempts, () => 1_700_000_000_000);
  }

  it('marks DELIVERED on a 2xx and sends a signature header', async () => {
    const httpPost = jest.fn().mockResolvedValue({ status: 200 });
    const update = jest.fn().mockResolvedValue({});
    const outcome = await build(httpPost, update).attempt(delivery());
    expect(outcome).toBe('DELIVERED');
    const headers = httpPost.mock.calls[0][2];
    expect(headers['X-PayChain-Signature']).toMatch(/^sha256=/);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DELIVERED' }) }),
    );
  });

  it('marks FAILED on a 5xx and increments attempts', async () => {
    const httpPost = jest.fn().mockResolvedValue({ status: 503 });
    const update = jest.fn().mockResolvedValue({});
    const outcome = await build(httpPost, update).attempt(delivery(0));
    expect(outcome).toBe('FAILED');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', attempts: 1 }) }),
    );
  });

  it('moves to DEAD (DLQ) once attempts reach the max', async () => {
    const httpPost = jest.fn().mockRejectedValue(new Error('timeout'));
    const update = jest.fn().mockResolvedValue({});
    const outcome = await build(httpPost, update, 6).attempt(delivery(5)); // 5 -> 6 = max
    expect(outcome).toBe('DEAD');
  });
});
