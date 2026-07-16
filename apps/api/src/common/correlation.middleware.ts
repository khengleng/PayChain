import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth-context';

const SAFE_CORRELATION_ID = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * Assigns a correlation id to every request (§0.5, §41). Runs as MIDDLEWARE (before guards),
 * so even guard-rejected responses (401/403/429) carry the id in logs and the response header.
 * An inbound X-Correlation-Id is honored only if it is safe (bounded, no control chars) — this
 * prevents header/log injection and bloat; otherwise a fresh id is generated.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(
    req: AuthedRequest & { headers: Record<string, string | string[] | undefined> },
    res: { setHeader(k: string, v: string): void },
    next: () => void,
  ): void {
    const incoming = req.headers['x-correlation-id'];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const correlationId =
      typeof candidate === 'string' && SAFE_CORRELATION_ID.test(candidate) ? candidate : randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
  }
}
