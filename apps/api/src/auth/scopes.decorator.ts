import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'required_scopes';

/**
 * Declares the scopes required to call a handler (§8, §34). Authorization is scope-based,
 * never role-name-based. The ScopesGuard enforces that the caller's token carries all
 * listed scopes.
 */
export const RequireScopes = (...scopes: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(SCOPES_KEY, scopes);
