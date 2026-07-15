import {
  canActivate,
  canTransition,
  khrMayLeaveLegalReview,
  missingActivationGates,
  REQUIRED_ACTIVATION_GATES,
} from './lifecycle';

describe('stablecoin lifecycle', () => {
  it('allows only the defined forward transitions', () => {
    expect(canTransition('DRAFT', 'LEGAL_REVIEW')).toBe(true);
    expect(canTransition('PILOT_APPROVED', 'ACTIVE')).toBe(true);
    // illegal jumps
    expect(canTransition('DRAFT', 'ACTIVE')).toBe(false);
    expect(canTransition('LEGAL_REVIEW', 'ACTIVE')).toBe(false);
    expect(canTransition('CLOSED', 'ACTIVE')).toBe(false);
  });

  it('blocks activation until every gate has passed (M3 exit gate §15)', () => {
    expect(canActivate([])).toBe(false);
    expect(canActivate(['LEGAL', 'COMPLIANCE', 'TREASURY'])).toBe(false);
    expect(missingActivationGates(['LEGAL'])).toEqual(
      expect.arrayContaining(['COMPLIANCE', 'TREASURY', 'RESERVE', 'TECHNICAL', 'PILOT']),
    );
    expect(canActivate(REQUIRED_ACTIVATION_GATES)).toBe(true);
  });

  it('pins KHR coins in LEGAL_REVIEW until legal sign-off (§0.6)', () => {
    expect(khrMayLeaveLegalReview('KHR', [])).toBe(false);
    expect(khrMayLeaveLegalReview('KHR', ['LEGAL'])).toBe(true);
    expect(khrMayLeaveLegalReview('USD', [])).toBe(true); // non-KHR unaffected
  });
});
