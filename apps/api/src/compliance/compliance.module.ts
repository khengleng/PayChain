import { Global, Module } from '@nestjs/common';
import { MockComplianceProvider, type ComplianceProvider } from '@paychain/compliance';

export const COMPLIANCE_PROVIDER = Symbol('COMPLIANCE_PROVIDER');

/**
 * Binds the compliance provider abstraction (§28). M3 uses the mock; a real KYC/AML/
 * sanctions vendor swaps in here without touching business code.
 */
@Global()
@Module({
  providers: [
    { provide: COMPLIANCE_PROVIDER, useFactory: (): ComplianceProvider => new MockComplianceProvider() },
  ],
  exports: [COMPLIANCE_PROVIDER],
})
export class ComplianceModule {}
