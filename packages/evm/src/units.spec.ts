import { fromBaseUnits, toBaseUnits } from './units';

describe('units (decimal string ↔ ERC-20 base units)', () => {
  it('round-trips whole and fractional amounts at various decimals', () => {
    expect(toBaseUnits('500', 7)).toBe(5_000_000_000n);
    expect(toBaseUnits('0.01', 7)).toBe(100_000n);
    expect(toBaseUnits('1', 18)).toBe(1_000_000_000_000_000_000n);
    expect(toBaseUnits('123', 0)).toBe(123n);

    expect(fromBaseUnits(5_000_000_000n, 7)).toBe('500');
    expect(fromBaseUnits(100_000n, 7)).toBe('0.01');
    expect(fromBaseUnits(1_000_000_000_000_000_000n, 18)).toBe('1');
    expect(fromBaseUnits(0n, 7)).toBe('0');
  });

  it('rejects malformed amounts and excess precision', () => {
    expect(() => toBaseUnits('abc', 7)).toThrow(/invalid amount/);
    expect(() => toBaseUnits('-1', 7)).toThrow(/invalid amount/);
    expect(() => toBaseUnits('0.123456789', 7)).toThrow(/fractional digits/);
  });
});
