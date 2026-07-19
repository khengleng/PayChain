import { Logger, Module } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { AuthModule } from '../auth/auth.module';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import {
  BANK_BALANCE_PROVIDER,
  HttpBankBalanceProvider,
  SandboxBankBalanceProvider,
  type BankBalanceProvider,
} from './bank-balance.provider';
import { ReserveVerificationService } from './reserve-verification.service';
import { SandboxBankController } from './sandbox-bank.controller';

/**
 * Sandbox bank (mock Bakong) + the reserve verification built on it (§31 "bank reserves").
 *
 * The provider binding is the seam a real Bakong connection swaps into. Everything downstream —
 * verification, drift, the "how much can we prove" total — is written against the interface, not
 * the mock, so that swap changes one line here and nothing else.
 */
@Module({
  imports: [AuthModule],
  controllers: [SandboxBankController],
  providers: [
    ReserveVerificationService,
    {
      // The seam a real Bakong connection swaps into. When BAKONG_API_* is configured, reserve
      // verification runs against the live read-only balance feed; otherwise it uses the sandbox
      // stand-in (a VERIFIED result then only proves the verification path, not that money exists).
      provide: BANK_BALANCE_PROVIDER,
      inject: [CONFIG, PrismaService],
      useFactory: (cfg: PayChainConfig, prisma: PrismaService): BankBalanceProvider => {
        if (cfg.BAKONG_API_BASE_URL && cfg.BAKONG_API_KEY) {
          new Logger('SandboxModule').log('Bank-balance provider: live Bakong HTTP client');
          return new HttpBankBalanceProvider(cfg.BAKONG_API_BASE_URL, cfg.BAKONG_API_KEY);
        }
        return new SandboxBankBalanceProvider(prisma);
      },
    },
  ],
  exports: [ReserveVerificationService],
})
export class SandboxModule {}
