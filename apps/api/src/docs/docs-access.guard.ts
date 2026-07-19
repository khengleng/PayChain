import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';

/**
 * Gates the public OpenAPI spec. When DOCS_PUBLIC is true (default) the spec is served to anyone —
 * the developer portal's live API reference fetches it anonymously. When set false, access requires
 * a valid admin token (delegated to AdminAuthGuard), so the full API contract is not exposed to
 * anonymous callers.
 */
@Injectable()
export class DocsAccessGuard implements CanActivate {
  private readonly isPublic: boolean;

  constructor(
    @Inject(CONFIG) config: PayChainConfig,
    private readonly adminGuard: AdminAuthGuard,
  ) {
    this.isPublic = config.DOCS_PUBLIC;
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (this.isPublic) return true;
    return this.adminGuard.canActivate(context);
  }
}
