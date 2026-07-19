import { generateKeyPairSync, sign as edSign, type KeyObject } from 'node:crypto';
import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { TrusteeService, TRUSTEE_INBOUND_TENANT } from './trustee.service';

/**
 * Receiver semantics with the trustee JWKS: the envelope is verified with the WEBHOOK key, and
 * artifact-bearing events (mint authorization / reserve snapshot) additionally verify an inner
 * signature with the purpose key before anything is recorded or acted on.
 */
describe('TrusteeService', () => {
  // One Ed25519 keypair per purpose. Private keys stand in for the trustee's signers; the registry
  // fake serves the public keys.
  const webhook = generateKeyPairSync('ed25519');
  const mintAuth = generateKeyPairSync('ed25519');
  const reserve = generateKeyPairSync('ed25519');

  const KEYS: Record<string, Record<string, KeyObject>> = {
    WEBHOOK: { 'webhook-v1': webhook.publicKey },
    MINT_AUTHORIZATION: { 'mint_authorization-v1': mintAuth.publicKey },
    RESERVE_SNAPSHOT: { 'reserve_snapshot-v1': reserve.publicKey },
  };

  function build(opts: { keys?: typeof KEYS; hasWebhook?: boolean } = {}) {
    const keyMap = opts.keys ?? KEYS;
    const record = jest.fn().mockResolvedValue(undefined);
    const run = jest
      .fn()
      .mockImplementation((_t, _k, _p, exec: () => Promise<unknown>) => exec());
    const getKey = jest.fn(async (purpose: string, keyId: string) => keyMap[purpose]?.[keyId] ?? null);
    const hasWebhookKeys = jest.fn(async () => opts.hasWebhook ?? true);
    const upsert = jest.fn().mockResolvedValue({});
    const recordTrusteeSnapshot = jest.fn().mockResolvedValue({});
    const svc = new TrusteeService(
      { TRUSTEE_WEBHOOK_KEY_ID: 'webhook-v1' } as unknown as PayChainConfig,
      { record } as never,
      { run } as never,
      { getKey, hasWebhookKeys } as never,
      { trusteeMintAuthorization: { upsert } } as never,
      { recordTrusteeSnapshot } as never,
    );
    return { svc, record, run, getKey, upsert, recordTrusteeSnapshot };
  }

  function envelope(body: string, timestamp = String(Date.now())) {
    const value = edSign(null, Buffer.from(`${timestamp}.${body}`, 'utf8'), webhook.privateKey).toString('base64');
    return { signature: value, timestamp };
  }

  function signedEvent(type: string, artifactObj: unknown, signer: KeyObject, keyId: string) {
    const artifact = JSON.stringify(artifactObj);
    const value = edSign(null, Buffer.from(artifact, 'utf8'), signer).toString('base64');
    return JSON.stringify({ type, artifact, signature: { keyId, alg: 'ed25519', value } });
  }

  const baseInput = (body: string) => {
    const { signature, timestamp } = envelope(body);
    return {
      rawBody: Buffer.from(body),
      signature,
      keyId: 'webhook-v1',
      timestamp,
      eventType: undefined as string | undefined,
      deliveryId: 'd1',
      correlationId: 'c1',
    };
  };

  it('503 when no webhook key is configured at all', async () => {
    const { svc } = build({ keys: {}, hasWebhook: false });
    await expect(svc.ingest(baseInput('{"type":"mint.confirmed"}'))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('401 when the webhook key id is unknown but the receiver is configured', async () => {
    const { svc } = build({ keys: {}, hasWebhook: true });
    await expect(svc.ingest(baseInput('{"type":"mint.confirmed"}'))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('400 on missing body / missing headers', async () => {
    const { svc } = build();
    await expect(svc.ingest({ ...baseInput('{}'), rawBody: undefined })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.ingest({ ...baseInput('{}'), signature: undefined })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('401 on a stale timestamp', async () => {
    const { svc } = build();
    const body = '{"type":"mint.confirmed"}';
    const staleTs = String(Date.now() - 10 * 60 * 1000);
    const value = edSign(null, Buffer.from(`${staleTs}.${body}`, 'utf8'), webhook.privateKey).toString('base64');
    await expect(
      svc.ingest({ ...baseInput(body), timestamp: staleTs, signature: value }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 on a forged envelope signature', async () => {
    const { svc, record } = build();
    await expect(
      svc.ingest({ ...baseInput('{"type":"mint.confirmed"}'), signature: Buffer.alloc(64, 9).toString('base64') }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(record).not.toHaveBeenCalled();
  });

  it('records an envelope-only informational event', async () => {
    const { svc, record, upsert, recordTrusteeSnapshot } = build();
    const ack = await svc.ingest(baseInput('{"type":"mint.confirmed"}'));
    expect(ack).toEqual({ received: true, deliveryId: 'd1', eventType: 'mint.confirmed' });
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ action: 'trustee.event.received' }));
    expect(upsert).not.toHaveBeenCalled();
    expect(recordTrusteeSnapshot).not.toHaveBeenCalled();
  });

  it('verifies + records a mint authorization', async () => {
    const { svc, upsert, record } = build();
    const artifact = {
      authorizationId: 'auth_1',
      reference: 'mintreq_1',
      tenantId: 't1',
      assetId: 'asset_1',
      amount: '100',
      destination: 'wallet_1',
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    };
    const body = signedEvent('mint.authorization.approved', artifact, mintAuth.privateKey, 'mint_authorization-v1');
    const ack = await svc.ingest(baseInput(body));
    expect(ack.eventType).toBe('mint.authorization.approved');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_authorizationId: { tenantId: 't1', authorizationId: 'auth_1' } },
        create: expect.objectContaining({ reference: 'mintreq_1', amount: '100', destination: 'wallet_1', status: 'VALID' }),
      }),
    );
    expect(record).toHaveBeenCalled();
  });

  it('401 and no write on a forged inner mint-authorization signature', async () => {
    const { svc, upsert, record } = build();
    const artifact = { authorizationId: 'auth_x', reference: 'r', tenantId: 't1', assetId: 'a', amount: '1', destination: 'w' };
    const good = signedEvent('mint.authorization.approved', artifact, mintAuth.privateKey, 'mint_authorization-v1');
    const parsed = JSON.parse(good);
    parsed.signature.value = Buffer.alloc(64, 3).toString('base64'); // tamper the inner sig
    const body = JSON.stringify(parsed);
    await expect(svc.ingest(baseInput(body))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(upsert).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('401 when the inner artifact is signed by an unknown key id', async () => {
    const { svc, upsert } = build();
    const artifact = { authorizationId: 'a', reference: 'r', tenantId: 't1', assetId: 'a', amount: '1', destination: 'w' };
    const body = signedEvent('mint.authorization.approved', artifact, mintAuth.privateKey, 'mint_authorization-v99');
    await expect(svc.ingest(baseInput(body))).rejects.toBeInstanceOf(UnauthorizedException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('tolerant: an artifact-bearing event with NO inner artifact is accepted envelope-only, not acted on', async () => {
    const { svc, upsert, record } = build();
    const body = JSON.stringify({ type: 'mint.authorization.approved' }); // no artifact/signature
    const ack = await svc.ingest(baseInput(body));
    expect(ack.eventType).toBe('mint.authorization.approved');
    expect(upsert).not.toHaveBeenCalled(); // no signed artifact → no authorization recorded
    expect(record).toHaveBeenCalled(); // but the receipt is recorded (no regression)
  });

  it('verifies + records a trustee reserve snapshot', async () => {
    const { svc, recordTrusteeSnapshot } = build();
    const artifact = { snapshotId: 'snap_1', tenantId: 't1', assetId: 'asset_1', reserveBalance: '5000', currency: 'USD' };
    const body = signedEvent('reserve.snapshot.created', artifact, reserve.privateKey, 'reserve_snapshot-v1');
    const ack = await svc.ingest(baseInput(body));
    expect(ack.eventType).toBe('reserve.snapshot.created');
    expect(recordTrusteeSnapshot).toHaveBeenCalledWith('t1', 'asset_1', {
      reserveBalance: '5000',
      trusteeSnapshotId: 'snap_1',
      keyId: 'reserve_snapshot-v1',
      signature: expect.any(String),
    });
  });

  it('dedups via the delivery id (idempotency layer)', async () => {
    const { svc, run } = build();
    await svc.ingest(baseInput('{"type":"mint.confirmed"}'));
    expect(run).toHaveBeenCalledWith(TRUSTEE_INBOUND_TENANT, 'd1', expect.anything(), expect.any(Function));
  });
});
