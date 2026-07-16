import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PENDING = 0; // responseStatus sentinel for a reserved-but-not-yet-completed key

/**
 * Tenant-scoped, persistent idempotency (§18).
 *
 * - Same key + same payload  → returns the stored response (no re-execution).
 * - Same key + different payload → 409 Conflict.
 * - Records survive restarts (backed by Postgres).
 *
 * Concurrency safety: the key is RESERVED (a placeholder row is inserted) BEFORE the
 * operation runs. Only the request that wins the unique-constraint insert executes; a
 * concurrent request with the same key either gets the stored result (if the winner already
 * finished) or a 409 "in progress". This prevents the double-execution/double-spend that a
 * check-then-execute approach would allow.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T extends object>(
    tenantId: string,
    key: string | undefined,
    requestPayload: unknown,
    exec: () => Promise<T>,
  ): Promise<T> {
    if (!key) return exec();
    const requestHash = CryptoService.sha256(JSON.stringify(requestPayload ?? {}));

    // 1. Reserve the key atomically. If it already exists, resolve against the stored record.
    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          tenantId,
          key,
          requestHash,
          responseStatus: PENDING,
          responseBody: {},
          expiresAt: new Date(Date.now() + DEFAULT_TTL_MS),
        },
      });
    } catch (err) {
      if (!this.isUniqueViolation(err)) throw err;
      return this.resolveExisting<T>(tenantId, key, requestHash);
    }

    // 2. We own the key — execute exactly once, then persist the result.
    try {
      const result = await exec();
      await this.prisma.idempotencyRecord.update({
        where: { tenantId_key: { tenantId, key } },
        data: { responseStatus: 200, responseBody: result as object },
      });
      return result;
    } catch (err) {
      // Execution failed — release the reservation so the client may retry safely.
      await this.prisma.idempotencyRecord
        .delete({ where: { tenantId_key: { tenantId, key } } })
        .catch(() => undefined);
      throw err;
    }
  }

  private async resolveExisting<T>(tenantId: string, key: string, requestHash: string): Promise<T> {
    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
    if (!existing) {
      // Extremely rare: the row vanished between insert-fail and read (e.g. a failed peer
      // released it). Treat as a conflict; the client can retry.
      throw new ConflictException('Idempotency-Key conflict, please retry');
    }
    if (existing.requestHash !== requestHash) {
      throw new ConflictException('Idempotency-Key reused with a different payload');
    }
    if (existing.responseStatus === PENDING) {
      throw new ConflictException('A request with this Idempotency-Key is already in progress');
    }
    return existing.responseBody as T;
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
