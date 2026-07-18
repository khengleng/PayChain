import type { ReadinessStatus } from '@paychain/database';

/**
 * The production-readiness gates (§43). Each is seeded once with its honest starting status;
 * operators then advance them with evidence. Production/mainnet activation is blocked until
 * every mandatory gate is PASSED (or WAIVED with a reason). These initial statuses are the
 * real current state of the platform, not aspirational.
 */
export interface GateSeed {
  key: string;
  category: string;
  title: string;
  mandatory: boolean;
  initialStatus: ReadinessStatus;
  evidence?: string;
}

export const READINESS_GATES: GateSeed[] = [
  { key: 'functional_integrity', category: 'Functional', title: 'Functional integrity', mandatory: true, initialStatus: 'PASSED', evidence: 'Unit suite + loyalty testnet e2e (issue/transfer/earn/compensate)' },
  { key: 'performance', category: 'Performance', title: 'Performance (300/1000 TPS on staging)', mandatory: true, initialStatus: 'IN_PROGRESS', evidence: 'Mock pipeline benchmarked; full-stack staging load pending (§0.7)' },
  { key: 'reliability', category: 'Reliability', title: 'Reliability (failover, recovery, chaos)', mandatory: true, initialStatus: 'IN_PROGRESS', evidence: 'Failover + circuit breaker tested; chaos drills pending' },
  { key: 'security', category: 'Security', title: 'Security (SAST, scans, pen test, key review)', mandatory: true, initialStatus: 'IN_PROGRESS', evidence: 'Headers/rate-limit/CI scans in place; pen test + KMS review pending' },
  { key: 'financial_integrity', category: 'Financial', title: 'Financial integrity (no drift, reconciliation)', mandatory: true, initialStatus: 'PASSED', evidence: 'Saga no-double-spend + reconciliation exception tests' },
  { key: 'loyalty_pilot', category: 'Pilot', title: 'Loyalty pilot (>=1M cumulative tx)', mandatory: true, initialStatus: 'PENDING' },
  { key: 'stablecoin_legal', category: 'Stablecoin', title: 'Stablecoin legal/regulatory readiness', mandatory: true, initialStatus: 'BLOCKED', evidence: 'Legal classification + licensing not complete' },
  { key: 'stablecoin_reserve', category: 'Stablecoin', title: 'Stablecoin reserve readiness', mandatory: true, initialStatus: 'PENDING' },
  { key: 'stablecoin_treasury', category: 'Stablecoin', title: 'Stablecoin treasury readiness', mandatory: true, initialStatus: 'PENDING' },
  { key: 'stablecoin_compliance', category: 'Stablecoin', title: 'Stablecoin compliance readiness', mandatory: true, initialStatus: 'PENDING', evidence: 'Real KYC/AML/sanctions vendor not yet integrated (mock only)' },
  { key: 'stablecoin_technical', category: 'Stablecoin', title: 'Stablecoin technical readiness', mandatory: true, initialStatus: 'IN_PROGRESS', evidence: 'Mint/burn/redeem/convert sagas tested on mock+testnet' },
  { key: 'stablecoin_pilot', category: 'Stablecoin', title: 'Stablecoin pilot readiness (closed mainnet)', mandatory: true, initialStatus: 'PENDING' },
  { key: 'key_management', category: 'Security', title: 'Key management (HSM/MPC issuer keys)', mandatory: true, initialStatus: 'BLOCKED', evidence: 'Dev-encrypted keys only; HSM/MPC is a hard pre-pilot gate (§0.6)' },
  { key: 'khr_legal_signoff', category: 'Stablecoin', title: 'KHR legal sign-off (NBC/Bakong policy)', mandatory: true, initialStatus: 'BLOCKED', evidence: 'KHR stablecoins pinned in LEGAL_REVIEW (§0.6)' },
  { key: 'trustee_integration', category: 'Integration', title: 'Trustee integration readiness', mandatory: true, initialStatus: 'PENDING', evidence: 'Requires trustee read-only API surface, docs, onboarding, and operational sign-off' },
  { key: 'paykh_migration', category: 'Migration', title: 'PayKH migration approval', mandatory: true, initialStatus: 'PENDING' },
];
