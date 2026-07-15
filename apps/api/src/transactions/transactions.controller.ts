import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { requireIdempotencyKey } from '../common/idempotency-key';
import { CompensationService } from './compensation.service';
import { TransactionsService } from './transactions.service';
import { CompensateDto } from './dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class TransactionsController {
  constructor(
    private readonly compensation: CompensationService,
    private readonly transactions: TransactionsService,
    private readonly idempotency: IdempotencyService,
  ) {}

  @Get()
  @RequireScopes('transaction.read')
  list(@CurrentAuth() auth: AuthContext, @Query('limit') limit?: string) {
    return this.transactions.list(auth, limit ? Number(limit) : undefined);
  }

  @Get(':transactionId')
  @RequireScopes('transaction.read')
  get(@CurrentAuth() auth: AuthContext, @Param('transactionId') id: string) {
    return this.transactions.get(auth, id);
  }

  /** POST /transactions/:id/compensate — reverse a business event via a compensating tx (§19). */
  @Post(':transactionId/compensate')
  @RequireScopes('transaction.compensate')
  compensate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('transactionId') transactionId: string,
    @Body() dto: CompensateDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.idempotency.run(
      auth.tenantId,
      requireIdempotencyKey(key),
      { transactionId, ...dto },
      () => this.compensation.compensate(auth, transactionId, dto, correlationId),
    );
  }

  /** POST /transactions/compensations/:id/approve — maker-checker approval (§19). */
  @Post('compensations/:compensationId/approve')
  @RequireScopes('transaction.approve')
  approve(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('compensationId') compensationId: string,
  ) {
    return this.compensation.approve(auth, compensationId, correlationId);
  }
}
