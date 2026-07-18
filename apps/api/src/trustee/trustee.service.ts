import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyWebhook } from '@paychain/security';
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

export interface TrusteeEventInput {
  /** The exact received bytes. Signature is verified over these, never a re-serialization. */
  rawBody: Buffer | undefined;
  signature: string | undefined;
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
 * docs/integration/API-CONTRACT.md). PayChain is a *client* of the trustee here: the trustee
 * signs each delivery with the shared §35 scheme and POSTs it to /api/v1/trustee/events.
 *
 * The endpoint is deliberately not JWT-authenticated — a machine sender holds no tenant token.
 * Authenticity comes entirely from the HMAC signature over the raw body, so verification must
 * fail closed: no secret configured, no signature, a bad signature, or a stale timestamp all
 * reject before the payload is trusted or recorded.
 *
 * Delivery is idempotent on the trustee's delivery id, so the trustee's retries and its
 * "replay all dead-lettered" backlog flush land exactly once.
 */
@Injectable()
export class TrusteeService {
  private readonly secret: string;

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
  ) {
    this.secret = config.TRUSTEE_WEBHOOK_SECRET ?? '';
  }

  async ingest(input: TrusteeEventInput): Promise<TrusteeEventAck> {
    if (!this.secret) {
      // Fail closed: accepting unverifiable events would let anyone forge trustee traffic.
      throw new ServiceUnavailableException('Trustee event receiver is not configured');
    }
    const { rawBody, signature, timestamp, eventType, deliveryId, correlationId } = input;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing request body');
    }
    if (!signature || !timestamp || !deliveryId) {
      throw new BadRequestException(
        'Missing X-Trustee-Signature, X-Trustee-Timestamp, or X-Trustee-Delivery header',
      );
    }

    const body = rawBody.toString('utf8');
    // Covers both a forged/mismatched signature and a stale-or-future timestamp (replay window).
    if (!verifyWebhook(this.secret, body, signature, timestamp)) {
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
          metadata: { eventType: resolvedType },
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
