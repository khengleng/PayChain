import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminPermissionGuard } from './admin-permission.guard';

@Global()
@Module({
  controllers: [AdminAuthController],
  providers: [
    {
      provide: AdminAuthService,
      inject: [PrismaService, JwtService, AuditService, CONFIG],
      useFactory: (prisma: PrismaService, jwt: JwtService, audit: AuditService, cfg: PayChainConfig) =>
        new AdminAuthService(prisma, jwt, audit, Math.min(cfg.JWT_ACCESS_TTL_SECONDS, 3600)),
    },
    AdminAuthGuard,
    AdminPermissionGuard,
  ],
  exports: [AdminAuthGuard, AdminPermissionGuard],
})
export class AdminAuthModule {}
