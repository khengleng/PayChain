import type {
  BusinessScreeningInput,
  ComplianceCaseResult,
  ComplianceProvider,
  CreateComplianceCaseInput,
  CustomerScreeningInput,
  GetComplianceCaseInput,
  ScreeningResult,
  TransactionScreeningInput,
  WalletScreeningInput,
} from './provider';

/**
 * Deterministic mock compliance provider for M3 (§28). Returns CLEAR by default; a
 * high-risk country list yields REVIEW/BLOCKED so tests and the control plane can exercise
 * hold/case paths without a real vendor. Real vendors implement the same interface later.
 */
export class MockComplianceProvider implements ComplianceProvider {
  readonly name = 'mock';

  constructor(private readonly blockedCountries: string[] = ['KP', 'IR', 'SY']) {}

  private assess(country?: string): ScreeningResult {
    if (country && this.blockedCountries.includes(country.toUpperCase())) {
      return { decision: 'BLOCKED', riskScore: 95, reasons: ['sanctioned_jurisdiction'], provider: this.name };
    }
    return { decision: 'CLEAR', riskScore: 5, reasons: [], provider: this.name };
  }

  async screenCustomer(input: CustomerScreeningInput): Promise<ScreeningResult> {
    return this.assess(input.country);
  }
  async screenBusiness(input: BusinessScreeningInput): Promise<ScreeningResult> {
    return this.assess(input.country);
  }
  async screenTransaction(input: TransactionScreeningInput): Promise<ScreeningResult> {
    return this.assess(input.counterpartyCountry);
  }
  async screenWallet(_input: WalletScreeningInput): Promise<ScreeningResult> {
    return { decision: 'CLEAR', riskScore: 1, reasons: [], provider: this.name };
  }
  async createCase(input: CreateComplianceCaseInput): Promise<ComplianceCaseResult> {
    return { caseId: `mock-case-${input.subjectReference}`, status: 'OPEN', provider: this.name };
  }
  async getCase(input: GetComplianceCaseInput): Promise<ComplianceCaseResult> {
    return { caseId: input.caseId, status: 'OPEN', provider: this.name };
  }
}
