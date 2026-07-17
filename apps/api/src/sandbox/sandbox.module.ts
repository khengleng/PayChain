import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BANK_BALANCE_PROVIDER, SandboxBankBalanceProvider } from './bank-balance.provider';
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
    { provide: BANK_BALANCE_PROVIDER, useClass: SandboxBankBalanceProvider },
  ],
  exports: [ReserveVerificationService],
})
export class SandboxModule {}
