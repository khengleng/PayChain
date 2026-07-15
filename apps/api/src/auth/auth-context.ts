import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * The authenticated caller context, derived from a verified JWT and attached to the
 * request by JwtAuthGuard. This is the ONLY source of tenant identity — a tenant id
 * supplied in a request body/param is never trusted (§7).
 */
export interface AuthContext {
  tenantId: string;
  clientId: string;
  scopes: string[];
}

export interface AuthedRequest {
  auth?: AuthContext;
  /** Per-request correlation id threaded into the pipeline (§0.5, §41). */
  correlationId: string;
}

/** Injects the AuthContext into a controller handler. */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.auth) {
      throw new Error('AuthContext missing — JwtAuthGuard must run before this handler');
    }
    return req.auth;
  },
);

/** Injects the request correlation id. */
export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.correlationId;
  },
);
