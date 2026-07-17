import { OutboxService } from './outbox.service';

/**
 * §0.5 — "a transactional outbox for all side effects". The guarantee is not that an event is
 * eventually written; it is that the event and the fact it describes land in the SAME
 * transaction. Either both or neither. These tests pin that, because the old code emitted the
 * event after and outside the business write, and a crash in that window lost it silently.
 */
describe('OutboxService (§0.5)', () => {
  function build(opts: { failAfterWrite?: boolean } = {}) {
    const committed: Record<string, any>[] = [];
    const staged: Record<string, any>[] = [];
    const tx = {
      outboxEvent: { create: async ({ data }: { data: Record<string, any> }) => { staged.push(data); return data; } },
    };
    const prisma = {
      // Models a real transaction: nothing is committed unless the callback resolves.
      $transaction: async (fn: (t: unknown) => Promise<unknown>) => {
        const out = await fn(tx);
        committed.push(...staged);
        return out;
      },
    } as never;
    return { svc: new OutboxService(prisma), committed, staged, opts };
  }

  const event = {
    tenantId: 't1', aggregateType: 'transaction', aggregateId: 'tx1',
    eventType: 'transaction.compensated', payload: { amount: '10' }, correlationId: 'c1',
  };

  it('writes the event inside the caller\'s transaction, as PENDING', async () => {
    const { svc, committed } = build();
    const result = await svc.withOutbox(async () => ({ result: 'ok', events: [event] }));
    expect(result).toBe('ok');
    expect(committed).toHaveLength(1);
    expect(committed[0]).toMatchObject({ eventType: 'transaction.compensated', status: 'PENDING', aggregateId: 'tx1' });
  });

  it('commits NOTHING when the business write fails — no orphan event', async () => {
    const { svc, committed } = build();
    await expect(
      svc.withOutbox(async () => { throw new Error('chain write failed'); }),
    ).rejects.toThrow('chain write failed');
    // An event describing a fact that never happened is worse than no event.
    expect(committed).toHaveLength(0);
  });

  it('records multiple events atomically with one write', async () => {
    const { svc, committed } = build();
    await svc.withOutbox(async () => ({ result: 1, events: [event, { ...event, aggregateId: 'tx2' }] }));
    expect(committed.map((c) => c.aggregateId)).toEqual(['tx1', 'tx2']);
  });

  it('defaults a null payload to {} rather than writing null', async () => {
    const { svc, committed } = build();
    await svc.withOutbox(async () => ({ result: 1, events: [{ ...event, payload: undefined }] }));
    expect(committed[0]!.payload).toEqual({});
  });
});
