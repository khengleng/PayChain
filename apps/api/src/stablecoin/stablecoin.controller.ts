import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { requireIdempotencyKey } from '../common/idempotency-key';
import { StablecoinService } from './stablecoin.service';
import { AdvanceDto, ApproveGateDto, CreateStablecoinDto, ProvisionMerchantCoinDto, SuspendDto } from './dto';

@Controller('stablecoins')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class StablecoinController {
  constructor(
    private readonly stablecoin: StablecoinService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  @RequireScopes('stablecoin.manage')
  create(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateStablecoinDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), dto, () =>
      this.stablecoin.create(auth, dto, correlationId),
    );
  }

  // One-call merchant-coin provisioning for a platform like PayKH. Narrow `stablecoin.provision`
  // scope; creates a branded, unit-valued coin in DRAFT (not minting).
  @Post('provision-merchant')
  @RequireScopes('stablecoin.provision')
  provisionMerchant(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Body() dto: ProvisionMerchantCoinDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, requireIdempotencyKey(key), dto, () =>
      this.stablecoin.provisionMerchantCoin(auth, dto, correlationId),
    );
  }

  @Get()
  @RequireScopes('stablecoin.read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.stablecoin.list(auth);
  }

  @Get(':stablecoinId')
  @RequireScopes('stablecoin.read')
  get(@CurrentAuth() auth: AuthContext, @Param('stablecoinId') id: string) {
    return this.stablecoin.get(auth, id);
  }

  @Post(':stablecoinId/submit-for-review')
  @RequireScopes('stablecoin.manage')
  submit(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('stablecoinId') id: string,
  ) {
    return this.stablecoin.submitForReview(auth, id, correlationId);
  }

  @Post(':stablecoinId/approve-gate')
  @RequireScopes('stablecoin.approve')
  approveGate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('stablecoinId') id: string,
    @Body() dto: ApproveGateDto,
  ) {
    return this.stablecoin.approveGate(auth, id, dto, correlationId);
  }

  @Post(':stablecoinId/advance')
  @RequireScopes('stablecoin.manage')
  advance(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('stablecoinId') id: string,
    @Body() dto: AdvanceDto,
  ) {
    // Activation is an approver action — it must go through /activate (stablecoin.approve),
    // so a manage-only caller can't flip a coin to ACTIVE via the generic advance.
    if (dto.toState === 'ACTIVE') {
      throw new BadRequestException('Use POST /activate (requires stablecoin.approve) to activate');
    }
    return this.stablecoin.advance(auth, id, dto.toState, correlationId);
  }

  @Post(':stablecoinId/activate')
  @RequireScopes('stablecoin.approve')
  activate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('stablecoinId') id: string,
  ) {
    return this.stablecoin.advance(auth, id, 'ACTIVE', correlationId);
  }

  @Post(':stablecoinId/suspend')
  @RequireScopes('stablecoin.manage')
  suspend(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('stablecoinId') id: string,
    @Body() dto: SuspendDto,
  ) {
    return this.stablecoin.suspend(auth, id, dto, correlationId);
  }
}
