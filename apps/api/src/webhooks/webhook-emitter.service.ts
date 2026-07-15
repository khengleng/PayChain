import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface EmitInput {
  tenantId: string;
  eventType: string;
  /** Stable id for this event (e.g. the transaction id). Guarantees at-most-once/endpoint. */
  eventId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

/**
 * Emits domain events to subscribed webhook endpoints (§35) by writing durable PENDING
 * delivery rows. Actual HTTP delivery is performed asynchronously by the worker, so
 * blockchain/API processing is never blocked waiting on a receiver.
 *
 * Duplicate protection: the (endpointId, eventId) unique constraint means emitting the
 * same event twice creates no second delivery — the duplicate insert is swallowed.
 */
@Injectable()
export class WebhookEmitterService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(input: EmitInput): Promise<{ created: number }> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId: input.tenantId, status: 'ACTIVE', events: { has: input.eventType } },
    });

    let created = 0;
    for (const ep of endpoints) {
      try {
        await this.prisma.webhookDelivery.create({
          data: {
            tenantId: input.tenantId,
            endpointId: ep.id,
            eventType: input.eventType,
            eventId: input.eventId,
            payload: input.payload as object,
            correlationId: input.correlationId,
            status: 'PENDING',
          },
        });
        created += 1;
      } catch (err) {
        // Unique (endpointId, eventId) violation = already queued → dedup, not an error.
        if (!this.isUniqueViolation(err)) throw err;
      }
    }
    return { created };
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    );
  }
}
