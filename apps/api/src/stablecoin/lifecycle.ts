/**
 * Stablecoin lifecycle state machine (§15) — pure logic, no I/O, fully unit-testable.
 * A stablecoin cannot reach ACTIVE until every required approval gate has passed, and
 * illegal state transitions are rejected.
 */

export type StablecoinState =
  | 'DRAFT'
  | 'LEGAL_REVIEW'
  | 'COMPLIANCE_REVIEW'
  | 'TREASURY_REVIEW'
  | 'RESERVE_PENDING'
  | 'TECHNICAL_TESTING'
  | 'PILOT_APPROVED'
  | 'ACTIVE'
  | 'MINTING_SUSPENDED'
  | 'REDEMPTION_SUSPENDED'
  | 'FULLY_SUSPENDED'
  | 'WIND_DOWN'
  | 'CLOSED';

export type ApprovalGate = 'LEGAL' | 'COMPLIANCE' | 'TREASURY' | 'RESERVE' | 'TECHNICAL' | 'PILOT';

export const REQUIRED_ACTIVATION_GATES: ApprovalGate[] = [
  'LEGAL',
  'COMPLIANCE',
  'TREASURY',
  'RESERVE',
  'TECHNICAL',
  'PILOT',
];

export const STABLECOIN_TRANSITIONS: Record<StablecoinState, StablecoinState[]> = {
  DRAFT: ['LEGAL_REVIEW', 'CLOSED'],
  LEGAL_REVIEW: ['COMPLIANCE_REVIEW', 'CLOSED'],
  COMPLIANCE_REVIEW: ['TREASURY_REVIEW', 'CLOSED'],
  TREASURY_REVIEW: ['RESERVE_PENDING', 'CLOSED'],
  RESERVE_PENDING: ['TECHNICAL_TESTING', 'CLOSED'],
  TECHNICAL_TESTING: ['PILOT_APPROVED', 'CLOSED'],
  PILOT_APPROVED: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['MINTING_SUSPENDED', 'REDEMPTION_SUSPENDED', 'FULLY_SUSPENDED', 'WIND_DOWN'],
  MINTING_SUSPENDED: ['ACTIVE', 'FULLY_SUSPENDED', 'WIND_DOWN'],
  REDEMPTION_SUSPENDED: ['ACTIVE', 'FULLY_SUSPENDED', 'WIND_DOWN'],
  FULLY_SUSPENDED: ['ACTIVE', 'WIND_DOWN'],
  WIND_DOWN: ['CLOSED'],
  CLOSED: [],
};

export function canTransition(from: StablecoinState, to: StablecoinState): boolean {
  return STABLECOIN_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Gates still missing before the coin may become ACTIVE. */
export function missingActivationGates(approved: ApprovalGate[]): ApprovalGate[] {
  const set = new Set(approved);
  return REQUIRED_ACTIVATION_GATES.filter((g) => !set.has(g));
}

export function canActivate(approved: ApprovalGate[]): boolean {
  return missingActivationGates(approved).length === 0;
}

/**
 * KHR-referenced coins (§0.6) are a regulatory landmine: they may not advance past
 * LEGAL_REVIEW without a recorded LEGAL sign-off.
 */
export function khrMayLeaveLegalReview(referenceCurrency: string, approved: ApprovalGate[]): boolean {
  if (referenceCurrency.toUpperCase() !== 'KHR') return true;
  return approved.includes('LEGAL');
}
