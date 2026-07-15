import { createHash } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

/**
 * M0 idempotency semantics (§18):
 *  - same key + same payload → returns stored result without re-executing;
 *  - same key + different payload → 409 Conflict.
 */
describe('IdempotencyService', () => {
  function buildService(record: {
    findUnique: jest.Mock;
    create: jest.Mock;
  }): IdempotencyService {
    const prisma = { idempotencyRecord: record } as never;
    return new IdempotencyService(prisma);
  }

  it('executes and stores when no prior record exists', async () => {
    const create = jest.fn().mockResolvedValue({});
    const svc = buildService({ findUnique: jest.fn().mockResolvedValue(null), create });
    const exec = jest.fn().mockResolvedValue({ ok: true });

    const result = await svc.run('t1', 'key-1', { a: 1 }, exec);

    expect(result).toEqual({ ok: true });
    expect(exec).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('returns the stored response for a replay with the same payload', async () => {
    const stored = {
      requestHash: createHash('sha256').update(JSON.stringify({ a: 1 })).digest('hex'),
      responseBody: { ok: 'cached' },
    };
    const svc = buildService({
      findUnique: jest.fn().mockResolvedValue(stored),
      create: jest.fn(),
    });
    const exec = jest.fn();

    const result = await svc.run('t1', 'key-1', { a: 1 }, exec);

    expect(result).toEqual({ ok: 'cached' });
    expect(exec).not.toHaveBeenCalled();
  });

  it('throws Conflict when the same key is reused with a different payload', async () => {
    const stored = { requestHash: 'different-hash', responseBody: {} };
    const svc = buildService({
      findUnique: jest.fn().mockResolvedValue(stored),
      create: jest.fn(),
    });

    await expect(svc.run('t1', 'key-1', { a: 2 }, jest.fn())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('bypasses idempotency when no key is supplied', async () => {
    const svc = buildService({ findUnique: jest.fn(), create: jest.fn() });
    const exec = jest.fn().mockResolvedValue({ ok: true });

    const result = await svc.run('t1', undefined, { a: 1 }, exec);

    expect(result).toEqual({ ok: true });
    expect(exec).toHaveBeenCalledTimes(1);
  });

  it('resolves a concurrent same-key race by returning the winner result', async () => {
    // Loser path: no prior record at read time, but the unique insert loses the race
    // (Prisma P2002), so we re-read and return the winner's stored response.
    const winner = {
      requestHash: createHash('sha256').update(JSON.stringify({ a: 1 })).digest('hex'),
      responseBody: { ok: 'winner' },
    };
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce(null) // initial read: nothing yet
      .mockResolvedValueOnce(winner); // re-read after the constraint violation
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const svc = buildService({ findUnique, create });

    const result = await svc.run('t1', 'key-race', { a: 1 }, jest.fn().mockResolvedValue({ ok: 'loser' }));

    expect(result).toEqual({ ok: 'winner' });
  });
});
