import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
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
      inject: [PrismaService, JwtService, CryptoService, AuditService, MailerService, CONFIG],
      useFactory: (
        prisma: PrismaService,
        jwt: JwtService,
        crypto: CryptoService,
        audit: AuditService,
        mailer: MailerService,
        cfg: PayChainConfig,
      ) =>
        new AdminAuthService(
          prisma,
          jwt,
          crypto,
          audit,
          mailer,
          Math.min(cfg.JWT_ACCESS_TTL_SECONDS, 3600),
          cfg.ADMIN_PORTAL_URL,
        ),
    },
    AdminAuthGuard,
    AdminPermissionGuard,
  ],
  exports: [AdminAuthGuard, AdminPermissionGuard],
})
export class AdminAuthModule {}
