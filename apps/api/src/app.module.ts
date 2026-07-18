import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuditModule } from './audit/audit.module';
import { OutboxModule } from './outbox/outbox.module';
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
import { SandboxModule } from './sandbox/sandbox.module';
import { StablecoinModule } from './stablecoin/stablecoin.module';
import { ReadinessModule } from './readiness/readiness.module';
import { TrusteeModule } from './trustee/trustee.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AdminClientsModule } from './admin-clients/admin-clients.module';
import { AdminTenantsModule } from './admin-tenants/admin-tenants.module';
import { AdminAssetsModule } from './admin-assets/admin-assets.module';
import { AdminReserveModule } from './admin-reserve/admin-reserve.module';
import { AdminWalletsModule } from './admin-wallets/admin-wallets.module';
import { AdminReadModule } from './admin-read/admin-read.module';
import { MailerModule } from './mailer/mailer.module';
import { HealthModule } from './health/health.module';
import { DocsModule } from './docs/docs.module';
import { CorrelationMiddleware } from './common/correlation.middleware';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ApiClientUsageMiddleware } from './auth/api-client-usage.middleware';

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
    OutboxModule,
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
    SandboxModule,
    MailerModule,
    AdminAuthModule,
    AdminUsersModule,
    AdminClientsModule,
    AdminTenantsModule,
    AdminAssetsModule,
    AdminReserveModule,
    AdminWalletsModule,
    AdminReadModule,
    ReadinessModule,
    TrusteeModule,
    HealthModule,
    DocsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    ApiClientUsageMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Runs before guards so guard-rejected responses still carry a correlation id.
    consumer.apply(CorrelationMiddleware, ApiClientUsageMiddleware).forRoutes('*');
  }
}
