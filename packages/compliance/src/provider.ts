/**
 * Compliance provider abstraction (§28). The business layer depends only on this interface,
 * never on a specific KYC/AML/sanctions vendor, so vendors can be swapped or run in parallel
 * without touching business logic. M3 ships the interface + a mock; real vendors integrate
 * behind this in later milestones.
 */

export type ScreeningDecision = 'CLEAR' | 'REVIEW' | 'BLOCKED';

export interface ScreeningResult {
  decision: ScreeningDecision;
  riskScore: number; // 0..100
  reasons: string[];
  provider: string;
  reference?: string;
}

export interface CustomerScreeningInput {
  tenantId: string;
  customerReference: string;
  fullName?: string;
  country?: string;
}

export interface BusinessScreeningInput {
  tenantId: string;
  businessReference: string;
  legalName?: string;
  country?: string;
}

export interface TransactionScreeningInput {
  tenantId: string;
  amount: string;
  assetCode: string;
  sourceReference?: string;
  destinationReference?: string;
  counterpartyCountry?: string;
}

export interface WalletScreeningInput {
  tenantId: string;
  walletId: string;
  stellarAccountId: string;
}

export interface CreateComplianceCaseInput {
  tenantId: string;
  subjectReference: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ComplianceCaseResult {
  caseId: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  provider: string;
}

export interface GetComplianceCaseInput {
  tenantId: string;
  caseId: string;
}

export interface ComplianceProvider {
  screenCustomer(input: CustomerScreeningInput): Promise<ScreeningResult>;
  screenBusiness(input: BusinessScreeningInput): Promise<ScreeningResult>;
  screenTransaction(input: TransactionScreeningInput): Promise<ScreeningResult>;
  screenWallet(input: WalletScreeningInput): Promise<ScreeningResult>;
  createCase(input: CreateComplianceCaseInput): Promise<ComplianceCaseResult>;
  getCase(input: GetComplianceCaseInput): Promise<ComplianceCaseResult>;
}
