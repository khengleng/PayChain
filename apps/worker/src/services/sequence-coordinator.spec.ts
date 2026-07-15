import { InMemoryLock, SequenceCoordinator } from './sequence-coordinator';

/**
 * M1 sequence-collision protection (§12): two operations on the SAME source account must
 * never run concurrently (they'd race the sequence number); operations on DIFFERENT source
 * accounts may overlap.
 */
describe('SequenceCoordinator', () => {
  function makeTask(tracker: { active: number; maxActive: number }) {
    return async () => {
      tracker.active += 1;
      tracker.maxActive = Math.max(tracker.maxActive, tracker.active);
      await new Promise((r) => setTimeout(r, 15));
      tracker.active -= 1;
    };
  }

  it('serializes work on the same source account', async () => {
    const coord = new SequenceCoordinator(new InMemoryLock());
    const tracker = { active: 0, maxActive: 0 };
    await Promise.all([
      coord.withSourceAccount('GSOURCE', makeTask(tracker)),
      coord.withSourceAccount('GSOURCE', makeTask(tracker)),
      coord.withSourceAccount('GSOURCE', makeTask(tracker)),
    ]);
    expect(tracker.maxActive).toBe(1); // never two at once
  });

  it('allows different source accounts to run concurrently', async () => {
    const coord = new SequenceCoordinator(new InMemoryLock());
    const tracker = { active: 0, maxActive: 0 };
    await Promise.all([
      coord.withSourceAccount('GA', makeTask(tracker)),
      coord.withSourceAccount('GB', makeTask(tracker)),
    ]);
    expect(tracker.maxActive).toBe(2); // overlap allowed
  });

  it('returns the wrapped function result', async () => {
    const coord = new SequenceCoordinator(new InMemoryLock());
    await expect(coord.withSourceAccount('GA', async () => 42)).resolves.toBe(42);
  });
});
