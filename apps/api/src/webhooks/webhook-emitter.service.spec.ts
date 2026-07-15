import { WebhookEmitterService } from './webhook-emitter.service';

/**
 * M1 duplicate-webhook protection (§35): emitting the same (endpoint, eventId) twice must
 * produce only one delivery. The second insert hits the unique constraint and is swallowed.
 */
describe('WebhookEmitterService', () => {
  function build(create: jest.Mock, endpoints: Array<{ id: string }>): WebhookEmitterService {
    const prisma = {
      webhookEndpoint: { findMany: jest.fn().mockResolvedValue(endpoints) },
      webhookDelivery: { create },
    } as never;
    return new WebhookEmitterService(prisma);
  }

  const emitInput = {
    tenantId: 't1',
    eventType: 'asset.issued',
    eventId: 'tx-1',
    payload: { amount: '100' },
  };

  it('creates one delivery per subscribed endpoint', async () => {
    const create = jest.fn().mockResolvedValue({});
    const svc = build(create, [{ id: 'ep-1' }, { id: 'ep-2' }]);
    const res = await svc.emit(emitInput);
    expect(res.created).toBe(2);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('dedups a repeated event (unique violation swallowed)', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const svc = build(create, [{ id: 'ep-1' }]);
    const res = await svc.emit(emitInput);
    expect(res.created).toBe(0); // already delivered/queued — no new row
  });

  it('rethrows non-unique database errors', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P1000' });
    const svc = build(create, [{ id: 'ep-1' }]);
    await expect(svc.emit(emitInput)).rejects.toMatchObject({ code: 'P1000' });
  });
});
