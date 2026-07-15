import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { WalletsModule } from './wallets/wallets.module';
import { AssetsModule } from './assets/assets.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { ComplianceModule } from './compliance/compliance.module';
import { StablecoinProvidersModule } from './stablecoin/providers/providers.module';
import { StablecoinModule } from './stablecoin/stablecoin.module';
import { HealthModule } from './health/health.module';
import { CorrelationInterceptor } from './common/correlation.interceptor';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

@Module({
  imports: [
    // Rate limiting (§41). 120 requests / 60s per client IP by default (in-memory store;
    // a Redis-backed store is the multi-instance upgrade).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AppConfigModule,
    PrismaModule,
    CryptoModule,
    BlockchainModule,
    AuditModule,
    AuthModule,
    IdempotencyModule,
    WalletsModule,
    AssetsModule,
    LoyaltyModule,
    TransactionsModule,
    WebhooksModule,
    FeatureFlagsModule,
    ComplianceModule,
    StablecoinProvidersModule,
    StablecoinModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
