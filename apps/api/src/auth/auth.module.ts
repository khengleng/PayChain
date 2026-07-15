import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ScopesGuard } from './scopes.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [CONFIG],
      useFactory: (cfg: PayChainConfig) => ({
        secret: cfg.JWT_SECRET,
        signOptions: { issuer: 'paychain', algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AuthService,
      inject: [PrismaService, JwtService, CONFIG],
      useFactory: (prisma: PrismaService, jwt: JwtService, cfg: PayChainConfig) =>
        new AuthService(prisma, jwt, cfg.JWT_ACCESS_TTL_SECONDS),
    },
    JwtAuthGuard,
    ScopesGuard,
  ],
  exports: [JwtModule, JwtAuthGuard, ScopesGuard],
})
export class AuthModule {}
