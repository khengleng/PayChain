import { randomUUID } from 'node:crypto';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { AuthedRequest } from '../auth/auth-context';

/**
 * Assigns a correlation id to every request (§0.5, §41). Honors an inbound
 * X-Correlation-Id header so callers can trace a business flow across systems, otherwise
 * generates one. The id is echoed back in the response header.
 */
@Injectable()
export class CorrelationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<AuthedRequest & { headers: Record<string, string> }>();
    const res = http.getResponse<{ setHeader(k: string, v: string): void }>();
    const incoming = req.headers['x-correlation-id'];
    const correlationId = incoming && incoming.length > 0 ? incoming : randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    return next.handle();
  }
}
