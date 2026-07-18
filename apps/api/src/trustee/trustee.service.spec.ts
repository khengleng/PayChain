import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { signWebhook } from '@paychain/security';
import type { PayChainConfig } from '@paychain/config';
import { TrusteeService, TRUSTEE_INBOUND_TENANT } from './trustee.service';

/**
 * Receiver semantics for trustee-signed webhooks (§35):
 *  - fails closed when no secret is configured, on a missing body/headers, and on a bad signature;
 *  - a valid signature records a receipt and acks;
 *  - delivery id is the dedup key handed to the idempotency layer.
 */
describe('TrusteeService', () => {
  const SECRET = 'whsec_test_trustee_secret';

  function build(secret: string | undefined) {
    const record = jest.fn().mockResolvedValue(undefined);
    // Idempotency stub: run the exec once, echoing the real "reserve-then-execute" contract.
    const run = jest
      .fn()
      .mockImplementation((_tenant, _key, _payload, exec: () => Promise<unknown>) => exec());
    const svc = new TrusteeService(
      { TRUSTEE_WEBHOOK_SECRET: secret } as unknown as PayChainConfig,
      { record } as never,
      { run } as never,
    );
    return { svc, record, run };
  }

  function signed(body: string) {
    const { signature, timestamp } = signWebhook(SECRET, body, Date.now());
    return { signature, timestamp };
  }

  it('fails closed with 503 when no secret is configured', async () => {
    const { svc } = build('');
    await expect(
      svc.ingest({
        rawBody: Buffer.from('{}'),
        signature: 'sha256=x',
        timestamp: String(Date.now()),
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects a missing body with 400', async () => {
    const { svc } = build(SECRET);
    await expect(
      svc.ingest({
        rawBody: undefined,
        signature: 'sha256=x',
        timestamp: String(Date.now()),
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing signature headers with 400', async () => {
    const { svc } = build(SECRET);
    await expect(
      svc.ingest({
        rawBody: Buffer.from('{"type":"trustee.ping"}'),
        signature: undefined,
        timestamp: undefined,
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a forged signature with 401', async () => {
    const { svc, record } = build(SECRET);
    await expect(
      svc.ingest({
        rawBody: Buffer.from('{"type":"trustee.ping"}'),
        signature: 'sha256=deadbeef',
        timestamp: String(Date.now()),
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects a body tampered after signing with 401', async () => {
    const { svc } = build(SECRET);
    const { signature, timestamp } = signed('{"type":"trustee.ping"}');
    await expect(
      svc.ingest({
        rawBody: Buffer.from('{"type":"trustee.ping","tampered":true}'),
        signature,
        timestamp,
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a stale timestamp (replay window) with 401', async () => {
    const { svc } = build(SECRET);
    const body = '{"type":"trustee.ping"}';
    const staleTs = Date.now() - 10 * 60 * 1000; // 10m ago, outside the 5m tolerance
    const { signature } = signWebhook(SECRET, body, staleTs);
    await expect(
      svc.ingest({
        rawBody: Buffer.from(body),
        signature,
        timestamp: String(staleTs),
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid delivery, records a receipt, and acks', async () => {
    const { svc, record, run } = build(SECRET);
    const body = '{"type":"trustee.attestation.published","id":"att_1"}';
    const { signature, timestamp } = signed(body);

    const ack = await svc.ingest({
      rawBody: Buffer.from(body),
      signature,
      timestamp,
      eventType: 'trustee.attestation.published',
      deliveryId: 'del_42',
      correlationId: 'corr_1',
    });

    expect(ack).toEqual({
      received: true,
      deliveryId: 'del_42',
      eventType: 'trustee.attestation.published',
    });
    // Deduped under the reserved inbound tenant, keyed by the trustee's delivery id.
    expect(run).toHaveBeenCalledWith(
      TRUSTEE_INBOUND_TENANT,
      'del_42',
      expect.objectContaining({ id: 'att_1' }),
      expect.any(Function),
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'trustee.event.received',
        resourceId: 'del_42',
        metadata: { eventType: 'trustee.attestation.published' },
      }),
    );
  });

  it('falls back to the payload type when the event header is absent', async () => {
    const { svc } = build(SECRET);
    const body = '{"type":"trustee.readiness.changed"}';
    const { signature, timestamp } = signed(body);

    const ack = await svc.ingest({
      rawBody: Buffer.from(body),
      signature,
      timestamp,
      eventType: undefined,
      deliveryId: 'del_43',
      correlationId: 'corr_1',
    });

    expect(ack.eventType).toBe('trustee.readiness.changed');
  });

  it('rejects a valid signature over a non-JSON body with 400', async () => {
    const { svc } = build(SECRET);
    const body = 'not-json';
    const { signature, timestamp } = signed(body);
    await expect(
      svc.ingest({
        rawBody: Buffer.from(body),
        signature,
        timestamp,
        eventType: 'trustee.ping',
        deliveryId: 'del_44',
        correlationId: 'corr_1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
