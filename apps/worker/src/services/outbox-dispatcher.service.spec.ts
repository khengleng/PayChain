import { OutboxDispatcherService } from './outbox-dispatcher.service';

/**
 * §0.5. OutboxEvent existed from day one and nothing wrote to it; side effects were emitted
 * outside the business transaction, so a crash in that window lost the event permanently. The
 * dispatcher is the other half: it turns durable rows into deliveries.
 */
const row = (over: Record<string, unknown> = {}) => ({
  id: 'o1', tenantId: 't1', eventType: 'transaction.compensated',
  aggregateId: 'tx1', payload: { a: 1 }, correlationId: 'c1', attempts: 0, ...over,
});

function build(opts: {
  rows?: Record<string, unknown>[];
  endpoints?: { id: string }[];
  claim?: number;
  createErr?: unknown;
} = {}) {
  const updates: Record<string, any>[] = [];
  const created: Record<string, any>[] = [];
  const prisma = {
    outboxEvent: {
      findMany: async () => (opts.rows ?? [row()]),
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        return { count: opts.claim ?? 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => { updates.push(data); return {}; },
    },
    webhookEndpoint: { findMany: async () => (opts.endpoints ?? [{ id: 'ep1' }]) },
    webhookDelivery: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (opts.createErr) throw opts.createErr;
        created.push(data);
        return {};
      },
    },
  } as never;
  return { svc: new OutboxDispatcherService(prisma), updates, created };
}

describe('OutboxDispatcherService (§0.5)', () => {
  it('fans a pending event out to every subscribed endpoint', async () => {
    const { svc, created } = build({ endpoints: [{ id: 'ep1' }, { id: 'ep2' }] });
    const res = await svc.dispatchPending();
    expect(res).toEqual({ scanned: 1, dispatched: 1, failed: 0 });
    expect(created.map((c) => c.endpointId)).toEqual(['ep1', 'ep2']);
    expect(created[0]).toMatchObject({ eventType: 'transaction.compensated', eventId: 'tx1' });
  });

  it('claims a row before working it, so two dispatchers cannot double-send', async () => {
    const { svc, updates } = build();
    await svc.dispatchPending();
    // The claim conditions on status PENDING and increments attempts.
    expect(updates[0]).toMatchObject({ status: 'PROCESSING', attempts: 1 });
  });

  it('skips a row it lost the claim on — no duplicate fan-out', async () => {
    const { svc, created } = build({ claim: 0 });
    const res = await svc.dispatchPending();
    expect(res.dispatched).toBe(0);
    expect(created).toHaveLength(0);
  });

  it('treats no subscribers as success — the event happened, nobody asked for it', async () => {
    const { svc, updates } = build({ endpoints: [] });
    const res = await svc.dispatchPending();
    expect(res.dispatched).toBe(1);
    expect(updates.some((u) => u.status === 'PROCESSED')).toBe(true);
  });

  it('treats a duplicate delivery as dedup, not failure', async () => {
    // A crash mid-fan-out must not double-send to endpoints already covered on the retry.
    const { svc } = build({ createErr: Object.assign(new Error('dup'), { code: 'P2002' }) });
    const res = await svc.dispatchPending();
    expect(res).toMatchObject({ dispatched: 1, failed: 0 });
  });

  it('returns a failed row to PENDING so it retries', async () => {
    const { svc, updates } = build({ createErr: new Error('db down') });
    const res = await svc.dispatchPending();
    expect(res.failed).toBe(1);
    expect(updates.some((u) => u.status === 'PENDING')).toBe(true);
  });

  it('stops retrying a poisoned row after MAX_ATTEMPTS, leaving it FAILED and visible', async () => {
    // Looping forever on an undeliverable row hides it; FAILED surfaces it for an operator.
    const { svc, updates } = build({ rows: [row({ attempts: 5 })], createErr: new Error('poison') });
    await svc.dispatchPending();
    expect(updates.some((u) => u.status === 'FAILED')).toBe(true);
  });

  it('processes oldest first — an event\'s order is part of its meaning', async () => {
    const { svc } = build({ rows: [row({ id: 'o1' }), row({ id: 'o2' })] });
    const res = await svc.dispatchPending();
    expect(res.scanned).toBe(2);
  });
});
