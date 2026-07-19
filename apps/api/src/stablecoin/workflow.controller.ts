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
import { SpendService } from './spend.service';
import { ConversionService } from './conversion.service';
import { ReserveService } from './reserve.service';
import { ReserveVerificationService } from '../sandbox/reserve-verification.service';
import { TreasuryService } from './treasury.service';
import { MonitoringService } from './monitoring.service';
import { AttestationService } from './attestation.service';
import {
  ConversionQuoteDto,
  MintRequestDto,
  MonitoringEvaluateDto,
  RedemptionRequestDto,
  SpendRequestDto,
  ExecuteTreasuryDto,
  PublishAttestationDto,
  RejectMovementDto,
  ReserveAccountDto,
  ReserveMovementDto,
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
    private readonly spend: SpendService,
    private readonly conversion: ConversionService,
    private readonly reserve: ReserveService,
    private readonly verification: ReserveVerificationService,
    private readonly treasury: TreasuryService,
    private readonly monitoring: MonitoringService,
    private readonly attestations: AttestationService,
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

  // --- spend-for-goods (§25-adjacent) ---
  // A customer spending merchant points on goods: burns supply, frees the backing reserve as
  // merchant revenue (withdrawn separately via the maker-checker reserve DEBIT). No fiat leg.
  @Post('stablecoins/:id/spends')
  @RequireScopes('stablecoin.spend')
  createSpend(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: SpendRequestDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), { id, ...dto }, () =>
      this.spend.request(auth, id, dto, corr),
    );
  }

  @Get('spends/:spendId')
  @RequireScopes('stablecoin.read')
  getSpend(@CurrentAuth() auth: AuthContext, @Param('spendId') sid: string) {
    return this.spend.get(auth.tenantId, sid);
  }

  @Post('spends/:spendId/advance')
  @RequireScopes('stablecoin.spend')
  advanceSpend(@CurrentAuth() auth: AuthContext, @Param('spendId') sid: string) {
    return this.spend.advance(auth.tenantId, sid);
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
    // Evaluate against the asset's configured target, not a hardcoded 1.0.
    return this.reserve.getStateForAsset(auth.tenantId, id);
  }

  /**
   * What the bank corroborates, versus what our books claim (§31 "bank reserves").
   *
   * Separate from GET /reserve on purpose. That endpoint sums the reserve ledger and is the
   * figure the ratio is computed from; this one asks whether that figure is true. Presenting
   * them as one number would bury the distinction that matters most — computed exactly, from an
   * input nobody checked.
   */
  @Get('stablecoins/:id/reserve/verification')
  @RequireScopes('stablecoin.read')
  verifyReserve(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.verification.verifiedTotal(auth.tenantId, id);
  }

  @Post('stablecoins/:id/reserve-snapshots')
  @RequireScopes('reserve.manage')
  snapshotReserve(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.reserve.snapshot(auth.tenantId, id, { source: 'manual' });
  }

  /**
   * Reserve movements are maker-checker gated (§23): requesting moves no money. `reserve.manage`
   * requests; a *different* principal holding `reserve.approve` applies it.
   */
  @Post('reserve/movements')
  @RequireScopes('reserve.manage')
  requestReserveMovement(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Body() dto: ReserveMovementDto,
  ) {
    return this.reserve.requestMovement(auth, dto, corr);
  }

  @Post('reserve/movements/:movementId/approve')
  @RequireScopes('reserve.approve')
  approveReserveMovement(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('movementId') movementId: string,
  ) {
    return this.reserve.approveMovement(auth, movementId, corr);
  }

  @Post('reserve/movements/:movementId/reject')
  @RequireScopes('reserve.approve')
  rejectReserveMovement(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('movementId') movementId: string,
    @Body() dto: RejectMovementDto,
  ) {
    return this.reserve.rejectMovement(auth, movementId, dto.reason, corr);
  }

  @Get('reserve/movements')
  @RequireScopes('reserve.read')
  listReserveMovements(@CurrentAuth() auth: AuthContext) {
    return this.reserve.listMovements(auth.tenantId);
  }

  // --- proof of reserve (§24) ---
  /**
   * Records an external attestation. Requires reserve.manage: publishing one asserts a third
   * party verified the reserve, which is a treasury act, not a read.
   */
  @Post('stablecoins/:id/attestations')
  @RequireScopes('reserve.manage')
  publishAttestation(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: PublishAttestationDto,
  ) {
    return this.attestations.publish(
      auth,
      {
        assetId: id,
        identifier: dto.identifier,
        documentHash: dto.documentHash,
        auditorReference: dto.auditorReference,
        reserveSnapshotId: dto.reserveSnapshotId,
        effectiveAt: new Date(dto.effectiveAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      corr,
    );
  }

  @Get('stablecoins/:id/attestations')
  @RequireScopes('stablecoin.read')
  listAttestations(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.attestations.list(auth.tenantId, id);
  }

  /** The attestation in force right now, or null. Expiry is evaluated here, not by a sweep. */
  @Get('stablecoins/:id/attestations/current')
  @RequireScopes('stablecoin.read')
  currentAttestation(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.attestations.current(auth.tenantId, id);
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

  /**
   * Records that an approved movement actually settled (§30). Requires treasury.approve, not
   * treasury.manage: attesting that money moved is a checker's act, not the requester's.
   */
  @Post('treasury/movements/:movementId/execute')
  @RequireScopes('treasury.approve')
  executeTreasury(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('movementId') movementId: string,
    @Body() dto: ExecuteTreasuryDto,
  ) {
    return this.treasury.execute(auth, movementId, dto.externalReference, corr);
  }

  @Get('treasury/movements')
  @RequireScopes('treasury.manage')
  listTreasury(@CurrentAuth() auth: AuthContext) {
    return this.treasury.list(auth);
  }

  @Get('treasury/movements/history')
  @RequireScopes('treasury.read')
  listTreasuryHistory(@CurrentAuth() auth: AuthContext) {
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
