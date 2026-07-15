import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Tenant-scoped, persistent idempotency (§18).
 *
 * - Same key + same payload  → returns the stored response (no re-execution).
 * - Same key + different payload → 409 Conflict.
 * - Records survive restarts (backed by Postgres).
 *
 * A race between two concurrent requests with the same key is resolved by a unique
 * constraint on (tenantId, key): the loser catches the constraint violation and returns
 * the winner's stored result. Full concurrency hardening lands in M1.
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
    if (!key) {
      // Idempotency is supported but not forced in M0; forcing on all writes is M1 (§18).
      return exec();
    }
    const requestHash = CryptoService.sha256(JSON.stringify(requestPayload ?? {}));

    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictException('Idempotency-Key reused with a different payload');
      }
      return existing.responseBody as T;
    }

    const result = await exec();

    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          tenantId,
          key,
          requestHash,
          responseStatus: 200,
          responseBody: result as object,
          expiresAt: new Date(Date.now() + DEFAULT_TTL_MS),
        },
      });
    } catch {
      // Concurrent create won the unique race; return the stored result instead.
      const winner = await this.prisma.idempotencyRecord.findUnique({
        where: { tenantId_key: { tenantId, key } },
      });
      if (winner && winner.requestHash === requestHash) return winner.responseBody as T;
      throw new ConflictException('Idempotency-Key conflict');
    }

    return result;
  }
}
