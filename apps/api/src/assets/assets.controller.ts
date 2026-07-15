import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { AssetsService } from './assets.service';
import { BurnDto, CreateAssetDto, IssueDto, RedeemDto, TransferDto } from './dto';

@Controller('assets')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class AssetsController {
  constructor(
    private readonly assets: AssetsService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  @RequireScopes('asset.create')
  create(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateAssetDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, key, dto, () =>
      this.assets.create(auth, dto, correlationId),
    );
  }

  @Get()
  @RequireScopes('asset.read')
  list(@CurrentAuth() auth: AuthContext) {
    return this.assets.list(auth);
  }

  @Get(':assetId')
  @RequireScopes('asset.read')
  get(@CurrentAuth() auth: AuthContext, @Param('assetId') assetId: string) {
    return this.assets.get(auth, assetId);
  }

  @Post(':assetId/activate')
  @RequireScopes('asset.create')
  activate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.assets.activate(auth, assetId, correlationId);
  }

  @Post(':assetId/issue')
  @RequireScopes('asset.issue')
  issue(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
    @Body() dto: IssueDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, key, { assetId, ...dto }, () =>
      this.assets.issue(auth, assetId, dto.destinationWalletId, dto.amount, correlationId),
    );
  }

  @Post(':assetId/transfer')
  @RequireScopes('asset.transfer')
  transfer(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
    @Body() dto: TransferDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, key, { assetId, ...dto }, () =>
      this.assets.transfer(
        auth,
        assetId,
        dto.sourceWalletId,
        dto.destinationWalletId,
        dto.amount,
        correlationId,
      ),
    );
  }

  @Post(':assetId/redeem')
  @RequireScopes('asset.transfer')
  redeem(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
    @Body() dto: RedeemDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, key, { assetId, ...dto }, () =>
      this.assets.redeem(auth, assetId, dto.sourceWalletId, dto.amount, correlationId),
    );
  }

  @Post(':assetId/burn')
  @RequireScopes('asset.burn')
  burn(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('assetId') assetId: string,
    @Body() dto: BurnDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(auth.tenantId, key, { assetId, ...dto }, () =>
      this.assets.burn(auth, assetId, dto.walletId, dto.amount, correlationId),
    );
  }
}
