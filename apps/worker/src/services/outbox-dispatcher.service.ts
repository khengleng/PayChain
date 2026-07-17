export interface OutboxRow {
  id: string;
  tenantId: string;
  eventType: string;
  aggregateId: string;
  payload: unknown;
  correlationId: string;
  attempts: number;
}

export interface OutboxPrisma {
  outboxEvent: {
    findMany(args: unknown): Promise<OutboxRow[]>;
    updateMany(args: unknown): Promise<{ count: number }>;
    update(args: unknown): Promise<unknown>;
  };
  webhookEndpoint: {
    findMany(args: unknown): Promise<Array<{ id: string }>>;
  };
  webhookDelivery: {
    create(args: unknown): Promise<unknown>;
  };
}

export interface OutboxResult {
  scanned: number;
  dispatched: number;
  failed: number;
}

/** After this many attempts a row stops being retried and is left FAILED for an operator. */
const MAX_ATTEMPTS = 6;

/**
 * Outbox dispatcher (§0.5).
 *
 * The API writes an OutboxEvent in the same transaction as the fact it describes; this turns
 * those rows into webhook deliveries. The handoff is what makes the guarantee: the event is
 * durable the instant the business write commits, so a crash anywhere after that loses nothing —
 * the row is still PENDING and gets picked up on the next pass.
 *
 * Two hops (outbox → delivery → HTTP) rather than delivering directly from here, because they
 * answer different questions: the outbox is the transactional handoff, WebhookDelivery is the
 * per-endpoint retry and dead-letter ledger. Collapsing them would mean a retry against one
 * endpoint re-fanned the event to all of them.
 */
export class OutboxDispatcherService {
  constructor(private readonly prisma: OutboxPrisma) {}

  async dispatchPending(limit = 100): Promise<OutboxResult> {
    const rows = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' }, // oldest first: an event's order is part of its meaning
      take: limit,
    });

    let dispatched = 0;
    let failed = 0;

    for (const row of rows) {
      // Claim the row before doing any work: two dispatchers must not fan the same event out
      // twice. Conditioning on status PENDING means the loser sees zero rows updated.
      const claim = await this.prisma.outboxEvent.updateMany({
        where: { id: row.id, status: 'PENDING' },
        data: { status: 'PROCESSING', attempts: row.attempts + 1 },
      });
      if (claim.count === 0) continue;

      try {
        const endpoints = await this.prisma.webhookEndpoint.findMany({
          where: { tenantId: row.tenantId, status: 'ACTIVE', events: { has: row.eventType } },
        });

        for (const ep of endpoints) {
          try {
            await this.prisma.webhookDelivery.create({
              data: {
                tenantId: row.tenantId,
                endpointId: ep.id,
                eventType: row.eventType,
                eventId: row.aggregateId,
                payload: (row.payload ?? {}) as object,
                correlationId: row.correlationId,
                status: 'PENDING',
              },
            });
          } catch (err) {
            // Unique (endpointId, eventId) = already queued. Dedup, not an error: a redelivery
            // after a crash mid-fan-out must not double-send to endpoints already covered.
            if (!isUniqueViolation(err)) throw err;
          }
        }

        // No subscribers is success, not failure: the event happened and nobody asked for it.
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { status: 'PROCESSED', processedAt: new Date() },
        });
        dispatched += 1;
      } catch {
        failed += 1;
        // Back to PENDING so it retries, unless it has exhausted its attempts — then leave it
        // FAILED and visible rather than looping forever on a poisoned row.
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: { status: row.attempts + 1 >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING' },
        });
      }
    }

    return { scanned: rows.length, dispatched, failed };
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002';
}
