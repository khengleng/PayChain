import { generateKeyPairSync, sign as cryptoSign } from 'node:crypto';
import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { TrusteeService, TRUSTEE_INBOUND_TENANT } from './trustee.service';

/**
 * Receiver semantics for Ed25519-signed trustee webhooks:
 *  - fails closed with no public key, on missing body/headers, unknown key id, stale timestamp,
 *    and on a bad/forged signature;
 *  - a valid signature over `${timestamp}.${body}` records a receipt and acks;
 *  - delivery id is the dedup key handed to the idempotency layer.
 */
describe('TrusteeService', () => {
  const KEY_ID = 'webhook-v1';
  // A throwaway Ed25519 keypair: the private key stands in for the trustee's signer, the public
  // key (PEM) is what PayChain is configured with.
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const PUBLIC_PEM = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  function build(pem: string | undefined, keyId = KEY_ID) {
    const record = jest.fn().mockResolvedValue(undefined);
    const run = jest
      .fn()
      .mockImplementation((_tenant, _key, _payload, exec: () => Promise<unknown>) => exec());
    const svc = new TrusteeService(
      { TRUSTEE_WEBHOOK_PUBLIC_KEY: pem, TRUSTEE_WEBHOOK_KEY_ID: keyId } as unknown as PayChainConfig,
      { record } as never,
      { run } as never,
    );
    return { svc, record, run };
  }

  function sign(body: string, timestamp: string): string {
    return cryptoSign(null, Buffer.from(`${timestamp}.${body}`, 'utf8'), privateKey).toString('base64');
  }

  function delivery(overrides: Partial<Parameters<TrusteeService['ingest']>[0]> = {}) {
    const body = overrides.rawBody?.toString() ?? '{"type":"trustee.ping"}';
    const timestamp = overrides.timestamp ?? String(Date.now());
    return {
      rawBody: Buffer.from(body),
      signature: sign(body, timestamp),
      keyId: KEY_ID,
      timestamp,
      eventType: 'trustee.ping',
      deliveryId: 'd1',
      correlationId: 'c1',
      ...overrides,
    };
  }

  it('fails closed with 503 when no public key is configured', async () => {
    const { svc } = build('');
    await expect(svc.ingest(delivery())).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('degrades to 503 (does not crash) when the configured key is malformed', async () => {
    const { svc, record } = build('not-a-valid-key');
    await expect(svc.ingest(delivery())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(record).not.toHaveBeenCalled();
  });

  it('accepts a bare base64 (no-PEM-armor) configured key', async () => {
    const bare = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
    const { svc } = build(bare);
    const ack = await svc.ingest(delivery({ deliveryId: 'del_bare' }));
    expect(ack.received).toBe(true);
  });

  it('rejects a missing body with 400', async () => {
    const { svc } = build(PUBLIC_PEM);
    await expect(svc.ingest(delivery({ rawBody: undefined }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects missing signature headers with 400', async () => {
    const { svc } = build(PUBLIC_PEM);
    await expect(svc.ingest(delivery({ signature: undefined }))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an unknown key id with 401', async () => {
    const { svc, record } = build(PUBLIC_PEM);
    await expect(svc.ingest(delivery({ keyId: 'webhook-v2' }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects a stale timestamp with 401', async () => {
    const { svc } = build(PUBLIC_PEM);
    const staleTs = String(Date.now() - 10 * 60 * 1000);
    await expect(
      svc.ingest(delivery({ timestamp: staleTs, signature: sign('{"type":"trustee.ping"}', staleTs) })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a forged signature with 401', async () => {
    const { svc, record } = build(PUBLIC_PEM);
    await expect(
      svc.ingest(delivery({ signature: Buffer.alloc(64, 7).toString('base64') })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects a body tampered after signing with 401', async () => {
    const { svc } = build(PUBLIC_PEM);
    const ts = String(Date.now());
    // Sign the clean body, then deliver a different one — the signature must no longer verify.
    await expect(
      svc.ingest({
        rawBody: Buffer.from('{"type":"trustee.ping","x":1}'),
        signature: sign('{"type":"trustee.ping"}', ts),
        keyId: KEY_ID,
        timestamp: ts,
        eventType: 'trustee.ping',
        deliveryId: 'd1',
        correlationId: 'c1',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid delivery, records a receipt, and acks', async () => {
    const { svc, record, run } = build(PUBLIC_PEM);
    const ts = String(Date.now());
    const body = '{"type":"trustee.attestation.published","id":"att_1"}';
    const ack = await svc.ingest({
      rawBody: Buffer.from(body),
      signature: sign(body, ts),
      keyId: KEY_ID,
      timestamp: ts,
      eventType: 'trustee.attestation.published',
      deliveryId: 'del_42',
      correlationId: 'corr_1',
    });

    expect(ack).toEqual({
      received: true,
      deliveryId: 'del_42',
      eventType: 'trustee.attestation.published',
    });
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
        metadata: { eventType: 'trustee.attestation.published', keyId: KEY_ID },
      }),
    );
  });

  it('verifies a hex-encoded signature too', async () => {
    const { svc } = build(PUBLIC_PEM);
    const ts = String(Date.now());
    const body = '{"type":"trustee.ping"}';
    const hexSig = cryptoSign(null, Buffer.from(`${ts}.${body}`, 'utf8'), privateKey).toString('hex');
    const ack = await svc.ingest({ ...delivery({ timestamp: ts }), signature: hexSig });
    expect(ack.received).toBe(true);
  });

  it('accepts a PEM with escaped newlines (Railway single-line env)', () => {
    const escaped = PUBLIC_PEM.replace(/\n/g, '\\n');
    expect(() => build(escaped)).not.toThrow();
  });

  it('falls back to the payload type when the event header is absent', async () => {
    const { svc } = build(PUBLIC_PEM);
    const ts = String(Date.now());
    const body = '{"type":"trustee.readiness.changed"}';
    const ack = await svc.ingest({
      rawBody: Buffer.from(body),
      signature: sign(body, ts),
      keyId: KEY_ID,
      timestamp: ts,
      eventType: undefined,
      deliveryId: 'del_43',
      correlationId: 'corr_1',
    });
    expect(ack.eventType).toBe('trustee.readiness.changed');
  });

  it('rejects a valid signature over a non-JSON body with 400', async () => {
    const { svc } = build(PUBLIC_PEM);
    const ts = String(Date.now());
    const body = 'not-json';
    await expect(
      svc.ingest({ ...delivery({ timestamp: ts }), rawBody: Buffer.from(body), signature: sign(body, ts) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
