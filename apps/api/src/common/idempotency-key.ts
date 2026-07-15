import { BadRequestException } from '@nestjs/common';

/**
 * M1 enforces idempotency on all write APIs (§18). A financial or state-changing write
 * MUST carry an Idempotency-Key header; requests without one are rejected so a client can
 * never accidentally double-submit a money-moving operation.
 */
export function requireIdempotencyKey(key: string | undefined): string {
  if (!key || key.trim().length === 0) {
    throw new BadRequestException('Idempotency-Key header is required for this operation');
  }
  if (key.length > 255) {
    throw new BadRequestException('Idempotency-Key must be at most 255 characters');
  }
  return key;
}
