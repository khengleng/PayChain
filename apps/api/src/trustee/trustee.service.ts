import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyEd25519 } from '@paychain/security';
import { CONFIG } from '../config/config.module';
import type { PayChainConfig } from '@paychain/config';
import { AuditService } from '../audit/audit.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReserveService } from '../stablecoin/reserve.service';
import { TrusteeKeyRegistry } from './trustee-key-registry.service';
import {
  TrusteeEventType,
  isSignedArtifactEvent,
  parseOptionalDate,
  purposeForEvent,
  requireStringFields,
  type DepositClearedArtifact,
  type MintAuthorizationArtifact,
  type ReserveSnapshotArtifact,
  type TrusteeSignedEvent,
} from './trustee-events';

/**
 * Inbound tenant sentinel. Trustee events are platform-level, not tenant-scoped: they arrive
 * from the external trustee platform, not from an authenticated PayChain tenant. Dedup and audit
 * rows for events that are not asset-scoped are filed under this reserved id.
 */
export const TRUSTEE_INBOUND_TENANT = '__trustee_inbound__';

/** How far a delivery timestamp may drift from server time before it is treated as a replay. */
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export interface TrusteeEventInput {
  /** The exact received bytes. The Ed25519 envelope signature is over these. */
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
 * Receiver for the external trustee platform's signed webhooks (docs/integration/API-CONTRACT.md
 * and trustee-events-contract.md). Two layers of trust:
 *  1. The ENVELOPE — the whole body is Ed25519-signed with the trustee's WEBHOOK key.
 *  2. The inner ARTIFACT — authorization/snapshot/attestation events additionally carry an artifact
 *     signed by a purpose-specific key (mint_authorization, reserve_snapshot, …), so a compromised
 *     webhook key cannot forge a mint authorization.
 * Both are verified against the trustee's published JWKS (TrusteeKeyRegistry). Everything fails
 * closed. Acting on an event is idempotent on the delivery id, so retries/replays apply once.
 */
@Injectable()
export class TrusteeService {
  private readonly defaultKeyId: string;

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    private readonly audit: AuditService,
    private readonly idempotency: IdempotencyService,
    private readonly keys: TrusteeKeyRegistry,
    private readonly prisma: PrismaService,
    private readonly reserve: ReserveService,
  ) {
    this.defaultKeyId = config.TRUSTEE_WEBHOOK_KEY_ID;
  }

  async ingest(input: TrusteeEventInput): Promise<TrusteeEventAck> {
    const { rawBody, signature, keyId, timestamp, eventType, deliveryId, correlationId } = input;
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing request body');
    }
    if (!signature || !timestamp || !deliveryId) {
      throw new BadRequestException(
        'Missing X-Trustee-Signature, X-Trustee-Timestamp, or X-Trustee-Delivery header',
      );
    }

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      throw new UnauthorizedException('Trustee webhook timestamp is stale or invalid');
    }

    // Envelope verification against the trustee's WEBHOOK key (JWKS, with a pinned fallback).
    const webhookKey = await this.keys.getKey('WEBHOOK', keyId ?? this.defaultKeyId);
    if (!webhookKey) {
      if (await this.keys.hasWebhookKeys()) {
        throw new UnauthorizedException(`Unknown trustee key id: ${keyId ?? this.defaultKeyId}`);
      }
      throw new ServiceUnavailableException('Trustee event receiver is not configured');
    }

    const body = rawBody.toString('utf8');
    if (!verifyEd25519(webhookKey, `${timestamp}.${body}`, signature)) {
      throw new UnauthorizedException('Invalid trustee webhook signature');
    }

    let event: unknown;
    try {
      event = JSON.parse(body);
    } catch {
      throw new BadRequestException('Body is not valid JSON');
    }

    const resolvedType = eventType ?? extractType(event) ?? 'unknown';

    // Verify the inner signed artifact (if any) BEFORE dedup/recording, so a forged artifact never
    // enters the idempotency store and cannot be "replayed" as accepted.
    const artifact = await this.verifyInnerArtifact(resolvedType, event);

    // Dedup on delivery id: retries / replayed dead-letters apply exactly once.
    return this.idempotency.run<TrusteeEventAck>(
      TRUSTEE_INBOUND_TENANT,
      deliveryId,
      event,
      async () => {
        await this.dispatch(resolvedType, artifact, event, { deliveryId, correlationId });
        return { received: true, deliveryId, eventType: resolvedType };
      },
    );
  }

  /**
   * If the event carries an inner artifact, verify its signature with the purpose key from the
   * JWKS and return the parsed artifact. Events with no inner artifact return null (envelope-only).
   */
  private async verifyInnerArtifact(type: string, event: unknown): Promise<unknown | null> {
    const purpose = purposeForEvent(type);
    if (!purpose) return null;
    // Tolerant by design: an artifact-bearing event that arrives WITHOUT an inner artifact is
    // accepted on the envelope signature alone and recorded, but not acted on (a mint stays blocked
    // until a signed authorization lands). This lets the trustee add inner signing incrementally
    // without a flag-day, and guarantees this change never regresses today's succeeding deliveries.
    // A PRESENT artifact is still fully verified below — a forged/invalid one is rejected (401).
    if (!isSignedArtifactEvent(event)) {
      return null;
    }
    const signed = event as TrusteeSignedEvent;
    const key = await this.keys.getKey(purpose, signed.signature.keyId);
    if (!key) {
      throw new UnauthorizedException(
        `Unknown trustee ${purpose} key id: ${signed.signature.keyId}`,
      );
    }
    if (!verifyEd25519(key, signed.artifact, signed.signature.value)) {
      throw new UnauthorizedException(`Invalid trustee ${purpose} artifact signature`);
    }
    try {
      return JSON.parse(signed.artifact);
    } catch {
      throw new BadRequestException(`Trustee ${purpose} artifact is not valid JSON`);
    }
  }

  private async dispatch(
    type: string,
    artifact: unknown,
    event: unknown,
    ctx: { deliveryId: string; correlationId: string },
  ): Promise<void> {
    // Only act when a verified inner artifact is present. When it is absent (informational events,
    // or an authorization/snapshot the trustee has not yet inner-signed) we record an envelope-only
    // receipt — no regression to today's behavior. A forged artifact never reaches here (401 above).
    if (artifact) {
      if (type === TrusteeEventType.MINT_AUTHORIZATION_APPROVED) {
        await this.recordMintAuthorization(artifact as MintAuthorizationArtifact, event, ctx);
        return;
      }
      if (type === TrusteeEventType.RESERVE_SNAPSHOT_CREATED) {
        await this.recordReserveSnapshot(artifact as ReserveSnapshotArtifact, event, ctx);
        return;
      }
      if (type === TrusteeEventType.DEPOSIT_CLEARED) {
        await this.recordDepositCleared(artifact as DepositClearedArtifact, event, ctx);
        return;
      }
    }
    await this.recordReceipt(type, ctx, {});
  }

  private async recordDepositCleared(
    a: DepositClearedArtifact,
    event: unknown,
    ctx: { deliveryId: string; correlationId: string },
  ): Promise<void> {
    this.validated(() => requireStringFields(a, ['depositId', 'tenantId', 'reference', 'amount']));
    const sig = (event as TrusteeSignedEvent).signature;
    await this.prisma.trusteeDeposit.upsert({
      where: { tenantId_depositId: { tenantId: a.tenantId, depositId: a.depositId } },
      create: {
        tenantId: a.tenantId,
        depositId: a.depositId,
        reference: a.reference,
        amount: a.amount,
        currency: a.currency ?? null,
        status: 'CLEARED',
        keyId: sig.keyId,
        signature: sig.value,
        artifact: (event as TrusteeSignedEvent).artifact,
      },
      update: {}, // idempotent on re-delivery
    });
    await this.recordReceipt(TrusteeEventType.DEPOSIT_CLEARED, ctx, {
      tenantId: a.tenantId,
      depositId: a.depositId,
      reference: a.reference,
      amount: a.amount,
    });
  }

  private async recordMintAuthorization(
    a: MintAuthorizationArtifact,
    event: unknown,
    ctx: { deliveryId: string; correlationId: string },
  ): Promise<void> {
    const expiresAt = this.validated(() => {
      requireStringFields(a, ['authorizationId', 'reference', 'tenantId', 'assetId', 'amount', 'destination']);
      return parseOptionalDate(a.expiresAt);
    });
    const sig = (event as TrusteeSignedEvent).signature;
    await this.prisma.trusteeMintAuthorization.upsert({
      where: { tenantId_authorizationId: { tenantId: a.tenantId, authorizationId: a.authorizationId } },
      create: {
        tenantId: a.tenantId,
        assetId: a.assetId,
        reference: a.reference,
        amount: a.amount,
        destination: a.destination,
        authorizationId: a.authorizationId,
        keyId: sig.keyId,
        signature: sig.value,
        artifact: (event as TrusteeSignedEvent).artifact,
        status: 'VALID',
        expiresAt,
      },
      update: {}, // idempotent: a re-delivered authorization must not resurrect a CONSUMED one
    });
    await this.recordReceipt(TrusteeEventType.MINT_AUTHORIZATION_APPROVED, ctx, {
      tenantId: a.tenantId,
      assetId: a.assetId,
      authorizationId: a.authorizationId,
      reference: a.reference,
    });
  }

  private async recordReserveSnapshot(
    a: ReserveSnapshotArtifact,
    event: unknown,
    ctx: { deliveryId: string; correlationId: string },
  ): Promise<void> {
    this.validated(() => requireStringFields(a, ['snapshotId', 'tenantId', 'assetId', 'reserveBalance']));
    const sig = (event as TrusteeSignedEvent).signature;
    await this.reserve.recordTrusteeSnapshot(a.tenantId, a.assetId, {
      reserveBalance: a.reserveBalance,
      trusteeSnapshotId: a.snapshotId,
      keyId: sig.keyId,
      signature: sig.value,
    });
    await this.recordReceipt(TrusteeEventType.RESERVE_SNAPSHOT_CREATED, ctx, {
      tenantId: a.tenantId,
      assetId: a.assetId,
      snapshotId: a.snapshotId,
      reserveBalance: a.reserveBalance,
    });
  }

  /** Run artifact validation, turning a validation Error into a clean 400 (not a Prisma 500). */
  private validated<T>(fn: () => T): T {
    try {
      return fn();
    } catch (err) {
      throw new BadRequestException(err instanceof Error ? err.message : 'invalid trustee artifact');
    }
  }

  private async recordReceipt(
    type: string,
    ctx: { deliveryId: string; correlationId: string },
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.audit.record({
      tenantId: (metadata.tenantId as string) ?? TRUSTEE_INBOUND_TENANT,
      actor: 'trustee-platform',
      action: 'trustee.event.received',
      resourceType: 'trustee_event',
      resourceId: ctx.deliveryId,
      correlationId: ctx.correlationId,
      metadata: { eventType: type, ...metadata },
    });
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
