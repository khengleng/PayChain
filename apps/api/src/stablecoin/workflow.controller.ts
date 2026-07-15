import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import type { MonitoringAlert } from '@paychain/database';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { requireIdempotencyKey } from '../common/idempotency-key';
import { MintService } from './mint.service';
import { RedemptionService } from './redemption.service';
import { ConversionService } from './conversion.service';
import { ReserveService } from './reserve.service';
import { TreasuryService } from './treasury.service';
import { MonitoringService } from './monitoring.service';
import {
  ConversionQuoteDto,
  MintRequestDto,
  MonitoringEvaluateDto,
  RedemptionRequestDto,
  ReserveAccountDto,
  TreasuryMovementDto,
} from './workflow.dto';

/**
 * Stablecoin workflow API (§15, §22, §25, §26, §33). All money-moving writes are
 * idempotent and flag-gated (the services enforce the disabled-by-default flags).
 */
@Controller()
@UseGuards(JwtAuthGuard, ScopesGuard)
export class StablecoinWorkflowController {
  constructor(
    private readonly mint: MintService,
    private readonly redemption: RedemptionService,
    private readonly conversion: ConversionService,
    private readonly reserve: ReserveService,
    private readonly treasury: TreasuryService,
    private readonly monitoring: MonitoringService,
    private readonly idempotency: IdempotencyService,
  ) {}

  // --- mint (§22) ---
  @Post('stablecoins/:id/mint-requests')
  @RequireScopes('stablecoin.manage')
  createMint(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: MintRequestDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), { id, ...dto }, () =>
      this.mint.request(auth, id, { ...dto, idempotencyKey: key }, corr),
    );
  }

  @Get('mint-requests/:mintId')
  @RequireScopes('stablecoin.read')
  getMint(@CurrentAuth() auth: AuthContext, @Param('mintId') mintId: string) {
    return this.mint.get(auth.tenantId, mintId);
  }

  @Post('mint-requests/:mintId/approve')
  @RequireScopes('stablecoin.approve')
  approveMint(@CurrentAuth() auth: AuthContext, @Param('mintId') mintId: string) {
    return this.mint.approve(auth, mintId);
  }

  @Post('mint-requests/:mintId/advance')
  @RequireScopes('stablecoin.manage')
  advanceMint(@CurrentAuth() auth: AuthContext, @Param('mintId') mintId: string) {
    return this.mint.advance(auth.tenantId, mintId);
  }

  // --- redemption (§25) ---
  @Post('stablecoins/:id/redemptions')
  @RequireScopes('stablecoin.manage')
  createRedemption(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: RedemptionRequestDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), { id, ...dto }, () =>
      this.redemption.request(auth, id, dto, corr),
    );
  }

  @Get('redemptions/:redemptionId')
  @RequireScopes('stablecoin.read')
  getRedemption(@CurrentAuth() auth: AuthContext, @Param('redemptionId') rid: string) {
    return this.redemption.get(auth.tenantId, rid);
  }

  @Post('redemptions/:redemptionId/approve')
  @RequireScopes('stablecoin.approve')
  approveRedemption(@CurrentAuth() auth: AuthContext, @Param('redemptionId') rid: string) {
    return this.redemption.approve(auth, rid);
  }

  @Post('redemptions/:redemptionId/advance')
  @RequireScopes('stablecoin.manage')
  advanceRedemption(@CurrentAuth() auth: AuthContext, @Param('redemptionId') rid: string) {
    return this.redemption.advance(auth.tenantId, rid);
  }

  // --- conversion (§26) ---
  @Post('conversions/quote')
  @RequireScopes('stablecoin.manage')
  quote(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Body() dto: ConversionQuoteDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), dto, () =>
      this.conversion.quote(auth, dto, corr),
    );
  }

  @Post('conversions/:conversionId/confirm')
  @RequireScopes('stablecoin.manage')
  confirmConversion(@CurrentAuth() auth: AuthContext, @Param('conversionId') cid: string) {
    return this.conversion.confirm(auth, cid);
  }

  @Post('conversions/:conversionId/advance')
  @RequireScopes('stablecoin.manage')
  advanceConversion(@CurrentAuth() auth: AuthContext, @Param('conversionId') cid: string) {
    return this.conversion.advance(auth.tenantId, cid);
  }

  @Get('conversions/:conversionId')
  @RequireScopes('stablecoin.read')
  getConversion(@CurrentAuth() auth: AuthContext, @Param('conversionId') cid: string) {
    return this.conversion.get(auth.tenantId, cid);
  }

  // --- reserve (§23) ---
  @Post('stablecoins/:id/reserve-accounts')
  @RequireScopes('reserve.manage')
  registerReserve(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: ReserveAccountDto,
  ) {
    return this.reserve.registerAccount(auth, { assetId: id, ...dto }, corr);
  }

  @Get('stablecoins/:id/reserve')
  @RequireScopes('stablecoin.read')
  getReserve(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.reserve.getState(auth.tenantId, id);
  }

  @Post('stablecoins/:id/reserve-snapshots')
  @RequireScopes('reserve.manage')
  snapshotReserve(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.reserve.snapshot(auth.tenantId, id);
  }

  // --- treasury (§30) ---
  @Post('treasury/movements')
  @RequireScopes('treasury.manage')
  createTreasury(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Body() dto: TreasuryMovementDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), dto, () =>
      this.treasury.create(auth, dto, corr),
    );
  }

  @Post('treasury/movements/:movementId/approve')
  @RequireScopes('treasury.approve')
  approveTreasury(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('movementId') mid: string,
  ) {
    return this.treasury.approve(auth, mid, corr);
  }

  @Get('treasury/movements')
  @RequireScopes('treasury.manage')
  listTreasury(@CurrentAuth() auth: AuthContext) {
    return this.treasury.list(auth);
  }

  // --- monitoring (§29) ---
  @Post('monitoring/evaluate')
  @RequireScopes('stablecoin.manage')
  evaluate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Body() dto: MonitoringEvaluateDto,
  ) {
    return this.monitoring.evaluate(auth, dto, corr);
  }

  @Get('monitoring/alerts')
  @RequireScopes('stablecoin.read')
  listAlerts(@CurrentAuth() auth: AuthContext): Promise<MonitoringAlert[]> {
    return this.monitoring.list(auth);
  }
}
