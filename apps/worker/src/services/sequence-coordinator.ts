import { randomUUID } from 'node:crypto';

/**
 * A mutual-exclusion lock. InMemoryLock serializes within one worker process; RedisLock
 * serializes across many instances (§12 — prevent Stellar sequence collisions by never
 * submitting two txns from the same source account concurrently).
 */
export interface Lock {
  acquire(key: string): Promise<() => Promise<void>>;
}

/** Single-process serialization via a per-key promise chain. */
export class InMemoryLock implements Lock {
  private readonly chains = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => Promise<void>> {
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const prev = this.chains.get(key) ?? Promise.resolve();
    this.chains.set(
      key,
      prev.then(() => held),
    );
    await prev; // wait for the previous holder to release
    return async () => {
      release();
    };
  }
}

/** Redis-backed distributed lock (SET NX PX + token-checked release). */
export class RedisLock implements Lock {
  constructor(
    private readonly redis: {
      set(key: string, val: string, px: 'PX', ttl: number, nx: 'NX'): Promise<string | null>;
      eval(script: string, numKeys: number, ...args: string[]): Promise<unknown>;
    },
    private readonly ttlMs = 30_000,
    private readonly retryMs = 50,
  ) {}

  async acquire(key: string): Promise<() => Promise<void>> {
    const lockKey = `lock:source:${key}`;
    const token = randomUUID();
    // Spin until acquired. TTL guarantees release even if a holder dies.
     
    while (true) {
      const ok = await this.redis.set(lockKey, token, 'PX', this.ttlMs, 'NX');
      if (ok) break;
      await new Promise((r) => setTimeout(r, this.retryMs));
    }
    return async () => {
      // Release only if we still own the lock (compare-and-delete).
      await this.redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        token,
      );
    };
  }
}

/**
 * Serializes work per Stellar source account so sequence numbers are consumed in order and
 * never collide (§12). Different source accounts proceed concurrently.
 */
export class SequenceCoordinator {
  constructor(private readonly lock: Lock) {}

  async withSourceAccount<T>(sourceKey: string, fn: () => Promise<T>): Promise<T> {
    const release = await this.lock.acquire(sourceKey);
    try {
      return await fn();
    } finally {
      await release();
    }
  }
}
