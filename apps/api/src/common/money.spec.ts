import { assertValidAmount, isValidAmount } from './money';

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
});
