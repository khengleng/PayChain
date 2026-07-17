import { Injectable } from '@nestjs/common';
import type { Prisma } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';

export interface OutboxEventInput {
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  correlationId: string;
}

/**
 * Transactional outbox (§0.5 — mandatory).
 *
 * §0.5 requires "a transactional outbox for all side effects (no fire-and-forget calls inside a
 * DB transaction)". The OutboxEvent model existed from day one and NOTHING wrote to it. Side
 * effects were emitted by calling the webhook fan-out directly, after and outside the business
 * write — so a crash in the window between committing a compensation and emitting its event lost
 * the event permanently, with no trace and no retry. That is precisely the failure §0.5 exists to
 * eliminate.
 *
 * The rule this enforces: an event is written in the SAME transaction as the fact it describes.
 * Either both land or neither does. Dispatch happens later, from a worker, driven by the row.
 *
 * `enqueue` deliberately takes a transaction client rather than using `this.prisma`. Calling it
 * outside a transaction would compile and appear to work while providing none of the guarantee —
 * so the signature makes the correct usage the only convenient one.
 */
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records a side effect atomically with the caller's write.
   *
   * @param tx the transaction client from `prisma.$transaction(...)`, NOT the base client.
   */
  async enqueue(tx: Prisma.TransactionClient, event: OutboxEventInput): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        tenantId: event.tenantId,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: (event.payload ?? {}) as object,
        correlationId: event.correlationId,
        status: 'PENDING',
      },
    });
  }

  /** Convenience: run `fn` in a transaction and enqueue the resulting events atomically with it. */
  async withOutbox<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<{ result: T; events: OutboxEventInput[] }>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const { result, events } = await fn(tx);
      for (const event of events) await this.enqueue(tx, event);
      return result;
    });
  }
}
