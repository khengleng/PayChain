import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { ReadinessService } from './readiness.service';

/**
 * Read-only readiness surface for external verifier/trustee integrations.
 *
 * This intentionally exposes summary + gate evidence only. Mutating readiness remains
 * admin-only because changing a gate is an operator act, not a tenant act.
 */
@Controller('platform')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class PartnerReadinessController {
  constructor(private readonly readiness: ReadinessService) {}

  @Get('readiness')
  @RequireScopes('platform.readiness')
  async getReadiness() {
    const [gates, summary] = await Promise.all([this.readiness.list(), this.readiness.summary()]);
    return { summary, gates };
  }
}
