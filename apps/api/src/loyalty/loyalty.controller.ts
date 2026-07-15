import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { requireIdempotencyKey } from '../common/idempotency-key';
import { LoyaltyService } from './loyalty.service';
import { EarnDto } from './dto';

@Controller('assets')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class LoyaltyController {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly idempotency: IdempotencyService,
  ) {}

  /** POST /api/v1/assets/:assetId/earn — evaluate rules and award points (§20). */
  @Post(':assetId/earn')
  @RequireScopes('asset.issue')
  earn(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
    @Body() dto: EarnDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), { assetId, ...dto }, () =>
      this.loyalty.earn(auth, assetId, dto, correlationId),
    );
  }
}
