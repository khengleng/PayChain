import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest } from './auth-context';
import { SCOPES_KEY } from './scopes.decorator';

/**
 * Enforces scope-based authorization (§8, §34). Runs after JwtAuthGuard. A handler with
 * no @RequireScopes is allowed for any authenticated caller.
 */
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const granted = new Set(req.auth?.scopes ?? []);
    const missing = required.filter((s) => !granted.has(s));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing required scope(s): ${missing.join(', ')}`);
    }
    return true;
  }
}
