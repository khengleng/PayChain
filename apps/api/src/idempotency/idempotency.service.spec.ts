import { createHash } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';

const hashOf = (payload: unknown) => createHash('sha256').update(JSON.stringify(payload)).digest('hex');

/**
 * M1 idempotency semantics (§18) with reserve-then-execute concurrency safety:
 *  - key reserved before exec → exec runs at most once;
 *  - same key + same payload replay → stored result, no re-exec;
 *  - same key + different payload → 409;
 *  - concurrent same key still in progress → 409;
 *  - failed exec releases the reservation.
 */
describe('IdempotencyService', () => {
  function build(record: {
    create: jest.Mock;
    findUnique?: jest.Mock;
    update?: jest.Mock;
    delete?: jest.Mock;
  }): IdempotencyService {
    const prisma = {
      idempotencyRecord: {
        create: record.create,
        findUnique: record.findUnique ?? jest.fn(),
        update: record.update ?? jest.fn().mockResolvedValue({}),
        delete: record.delete ?? jest.fn().mockResolvedValue({}),
      },
    } as never;
    return new IdempotencyService(prisma);
  }

  it('reserves the key, executes once, and stores the result', async () => {
    const create = jest.fn().mockResolvedValue({});
    const update = jest.fn().mockResolvedValue({});
    const svc = build({ create, update });
    const exec = jest.fn().mockResolvedValue({ ok: true });

    const result = await svc.run('t1', 'key-1', { a: 1 }, exec);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1); // reservation
    expect(exec).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ responseStatus: 200, responseBody: { ok: true } }) }),
    );
  });

  it('returns the stored response for a completed replay (same payload), without re-executing', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const findUnique = jest.fn().mockResolvedValue({
      requestHash: hashOf({ a: 1 }),
      responseStatus: 200,
      responseBody: { ok: 'cached' },
    });
    const svc = build({ create, findUnique });
    const exec = jest.fn();

    const result = await svc.run('t1', 'key-1', { a: 1 }, exec);

    expect(result).toEqual({ ok: 'cached' });
    expect(exec).not.toHaveBeenCalled();
  });

  it('throws Conflict when the same key is reused with a different payload', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const findUnique = jest.fn().mockResolvedValue({ requestHash: 'different', responseStatus: 200, responseBody: {} });
    const svc = build({ create, findUnique });

    await expect(svc.run('t1', 'key-1', { a: 2 }, jest.fn())).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a concurrent same-key request that is still in progress', async () => {
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const findUnique = jest.fn().mockResolvedValue({ requestHash: hashOf({ a: 1 }), responseStatus: 0, responseBody: {} });
    const svc = build({ create, findUnique });
    const exec = jest.fn();

    await expect(svc.run('t1', 'key-1', { a: 1 }, exec)).rejects.toBeInstanceOf(ConflictException);
    expect(exec).not.toHaveBeenCalled(); // never double-executes
  });

  it('releases the reservation when execution fails', async () => {
    const create = jest.fn().mockResolvedValue({});
    const del = jest.fn().mockResolvedValue({});
    const svc = build({ create, delete: del });
    const exec = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(svc.run('t1', 'key-1', { a: 1 }, exec)).rejects.toThrow('boom');
    expect(del).toHaveBeenCalledTimes(1); // reservation released for retry
  });

  it('bypasses idempotency when no key is supplied', async () => {
    const svc = build({ create: jest.fn() });
    const exec = jest.fn().mockResolvedValue({ ok: true });
    const result = await svc.run('t1', undefined, { a: 1 }, exec);
    expect(result).toEqual({ ok: true });
    expect(exec).toHaveBeenCalledTimes(1);
  });
});
