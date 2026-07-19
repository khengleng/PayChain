import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { KeyObject } from 'node:crypto';
import { loadEd25519PublicKey, verifyEd25519 } from '@paychain/security';
import { CONFIG } from '../config/config.module';
import type { PayChainConfig } from '@paychain/config';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../idempotency/idempotency.service';

/**
 * Inbound tenant sentinel. Trustee events are platform-level, not tenant-scoped: they arrive
 * from the external trustee platform, not from an authenticated PayChain tenant. The dedup and
 * audit rows are filed under this reserved id so they never collide with a real tenant.
 */
export const TRUSTEE_INBOUND_TENANT = '__trustee_inbound__';

/** How far a delivery timestamp may drift from server time before it is treated as a replay. */
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export interface TrusteeEventInput {
  /** The exact received bytes. The Ed25519 signature is over these, never a re-serialization. */
  rawBody: Buffer | undefined;
  signature: string | undefined;
  keyId: string | undefined;
  timestamp: string | undefined;
  eventType: string | undefined;
  deliveryId: string | undefined;
  correlationId: string;
}

export interface TrusteeEventAck {
  received: true;
  deliveryId: string;
  eventType: string;
}

/**
 * Receiver for outbound webhooks from the external trustee platform (see
 * docs/integration/API-CONTRACT.md). PayChain is a *client* of the trustee here: the trustee signs
 * each delivery with its Ed25519 private key and POSTs it to /api/v1/trustee/events.
 *
 * The endpoint is deliberately not JWT-authenticated — a machine sender holds no tenant token.
 * Authenticity comes entirely from the Ed25519 signature over the raw body, so verification must
 * fail closed: no public key configured, missing headers, an unknown key id, a bad signature, or a
 * stale timestamp all reject before the payload is trusted or recorded.
 *
 * Delivery is idempotent on the trustee's delivery id, so the trustee's retries and its
 * "replay all dead-lettered" backlog flush land exactly once.
 *
 * ASSUMED WIRE FORMAT (confirm against the trustee contract before trusting in prod):
 *   - signed message = `${timestamp}.${rawBody}`
 *   - X-Trustee-Signature: base64 (or hex) Ed25519 signature
 *   - X-Trustee-Key-Id: matches TRUSTEE_WEBHOOK_KEY_ID
 *   - X-Trustee-Timestamp: unix ms · X-Trustee-Delivery: unique id
 */
@Injectable()
export class TrusteeService {
  private readonly logger = new Logger(TrusteeService.name);
  private readonly publicKey: KeyObject | null;
  private readonly keyId: string;

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
  ) {
    this.keyId = config.TRUSTEE_WEBHOOK_KEY_ID;
    const raw = (config.TRUSTEE_WEBHOOK_PUBLIC_KEY ?? '').trim();
    // A malformed key must NOT crash the whole API at boot — degrade the receiver to 503 instead.
    // The rest of the platform has nothing to do with this one webhook endpoint.
    let key: KeyObject | null = null;
    if (raw) {
      try {
        key = loadEd25519PublicKey(raw);
      } catch (err) {
        this.logger.error(
          `TRUSTEE_WEBHOOK_PUBLIC_KEY is set but not a valid Ed25519 key — receiver disabled (503): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
    this.publicKey = key;
  }

  async ingest(input: TrusteeEventInput): Promise<TrusteeEventAck> {
    if (!this.publicKey) {
      // Fail closed: accepting unverifiable events would let anyone forge trustee traffic.
      throw new ServiceUnavailableException('Trustee event receiver is not configured');
    }
    const { rawBody, signature, keyId, timestamp, eventType, deliveryId, correlationId } = input;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing request body');
    }
    if (!signature || !timestamp || !deliveryId) {
      throw new BadRequestException(
        'Missing X-Trustee-Signature, X-Trustee-Timestamp, or X-Trustee-Delivery header',
      );
    }
    // A delivery signed by a key id we do not recognise cannot be trusted, even if the bytes verify
    // against the configured key — the mismatch means our key material is stale.
    if (keyId && keyId !== this.keyId) {
      throw new UnauthorizedException(`Unknown trustee key id: ${keyId}`);
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      throw new UnauthorizedException('Trustee webhook timestamp is stale or invalid');
    }

    const body = rawBody.toString('utf8');
    const signedMessage = `${timestamp}.${body}`;
    if (!verifyEd25519(this.publicKey, signedMessage, signature)) {
      throw new UnauthorizedException('Invalid trustee webhook signature');
    }

    let event: unknown;
    try {
      event = JSON.parse(body);
    } catch {
      throw new BadRequestException('Body is not valid JSON');
    }

    const resolvedType = eventType ?? extractType(event) ?? 'unknown';

    // Dedup on the delivery id: a trustee retry (or a replayed dead-letter) with the same id
    // returns the first stored ack without re-recording. A same-id-different-body reuse is a
    // tamper/bug signal and surfaces as a 409 from the idempotency layer.
    return this.idempotency.run<TrusteeEventAck>(
      TRUSTEE_INBOUND_TENANT,
      deliveryId,
      event,
      async () => {
        await this.audit.record({
          tenantId: TRUSTEE_INBOUND_TENANT,
          actor: 'trustee-platform',
          action: 'trustee.event.received',
          resourceType: 'trustee_event',
          resourceId: deliveryId,
          correlationId,
          metadata: { eventType: resolvedType, keyId: this.keyId },
        });
        return { received: true, deliveryId, eventType: resolvedType };
      },
    );
  }
}

/** Best-effort event-type read from the payload when the X-Trustee-Event header is absent. */
function extractType(event: unknown): string | undefined {
  if (event && typeof event === 'object') {
    const t = (event as Record<string, unknown>).type;
    if (typeof t === 'string' && t.length > 0) return t;
  }
  return undefined;
}
