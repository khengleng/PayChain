import {
  addAmounts,
  assertValidAmount,
  compareAmounts,
  isValidAmount,
  mulAmounts,
  normalizeAmount,
  subAmounts,
  sumAmounts,
} from './money';

describe('money', () => {
  it('accepts positive decimals up to 7 dp', () => {
    expect(isValidAmount('1')).toBe(true);
    expect(isValidAmount('100.5')).toBe(true);
    expect(isValidAmount('0.0000001')).toBe(true);
  });

  it('rejects zero, negatives, and over-precision', () => {
    expect(isValidAmount('0')).toBe(false);
    expect(isValidAmount('-5')).toBe(false);
    expect(isValidAmount('1.00000001')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
    expect(isValidAmount('')).toBe(false);
  });

  it('assertValidAmount throws on invalid input', () => {
    expect(() => assertValidAmount('0')).toThrow();
    expect(() => assertValidAmount('1')).not.toThrow();
  });

  describe('fixed-point arithmetic (no float drift)', () => {
    it('adds without IEEE-754 error', () => {
      expect(addAmounts('0.1', '0.2')).toBe('0.3'); // 0.1 + 0.2 !== 0.30000000000000004
      expect(addAmounts('100', '0.0000001')).toBe('100.0000001');
    });

    it('subtracts exactly', () => {
      expect(subAmounts('1', '0.4')).toBe('0.6');
      expect(subAmounts('100', '100')).toBe('0');
    });

    it('sums a list exactly', () => {
      expect(sumAmounts(['0.1', '0.1', '0.1'])).toBe('0.3');
      expect(sumAmounts([])).toBe('0');
    });

    it('compares amounts exactly', () => {
      expect(compareAmounts('1.0000001', '1')).toBe(1);
      expect(compareAmounts('1', '1')).toBe(0);
      expect(compareAmounts('0.9', '1')).toBe(-1);
    });

    it('normalizes a fractional number to a valid 7-dp amount', () => {
      expect(normalizeAmount(12.30000000001)).toBe('12.3');
      expect(normalizeAmount(0)).toBe('0');
      expect(isValidAmount(normalizeAmount(1000000000 * 0.01))).toBe(true);
    });
  });
});

describe('mulAmounts (exact fixed-point product)', () => {
  it('multiplies exactly for realistic denominations', () => {
    expect(mulAmounts('1000', '0.01')).toBe('10'); // 1000 coins × $0.01 = $10
    expect(mulAmounts('1000', '100')).toBe('100000'); // 1000 coins × 100 KHR
    expect(mulAmounts('1234', '1')).toBe('1234'); // × 1 is identity
    expect(mulAmounts('0', '0.01')).toBe('0');
    expect(mulAmounts('0.5', '0.5')).toBe('0.25');
  });
});
