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
import { CreateWalletDto } from './dto';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class WalletsController {
  constructor(
    private readonly wallets: WalletsService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Post()
  @RequireScopes('wallet.write')
  async create(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateWalletDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.idempotency.run(auth.tenantId, idempotencyKey, dto, () =>
      this.wallets.create(auth, dto, correlationId),
    );
  }

  @Get(':walletId')
  @RequireScopes('wallet.read')
  async get(@CurrentAuth() auth: AuthContext, @Param('walletId') walletId: string) {
    return this.wallets.get(auth, walletId);
  }

  @Get(':walletId/balances')
  @RequireScopes('wallet.read')
  async balances(@CurrentAuth() auth: AuthContext, @Param('walletId') walletId: string) {
    return this.wallets.listBalances(auth, walletId);
  }
}
