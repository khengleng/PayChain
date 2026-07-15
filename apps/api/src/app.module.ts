import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { WalletsModule } from './wallets/wallets.module';
import { AssetsModule } from './assets/assets.module';
import { HealthModule } from './health/health.module';
import { CorrelationInterceptor } from './common/correlation.interceptor';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CryptoModule,
    BlockchainModule,
    AuditModule,
    AuthModule,
    IdempotencyModule,
    WalletsModule,
    AssetsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor }],
})
export class AppModule {}
