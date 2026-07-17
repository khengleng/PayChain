import { displayRatio, meetsRatio } from './reserve.service';

/**
 * §47: no float money. The reserve ratio decides whether tokens are backed — the most
 * safety-critical comparison in the system — and the first version of this code did it with
 * `Number(reserve) / Number(supply) < Number(target)`. These tests pin the exact arithmetic.
 */
describe('meetsRatio — the backing decision is exact', () => {
  it('meets an exactly-1.0 target at exactly 1:1', () => {
    expect(meetsRatio('1000', '1000', '1.0')).toBe(true);
  });

  it('fails one stroop short of the target', () => {
    // Float division would round this to 1.0 and let the mint through.
    expect(meetsRatio('999.9999999', '1000', '1.0')).toBe(false);
  });

  it('honours a configured over-collateralisation target', () => {
    expect(meetsRatio('1050', '1000', '1.05')).toBe(true);
    expect(meetsRatio('1049.9999999', '1000', '1.05')).toBe(false);
  });

  it('is exact at magnitudes where float division loses precision', () => {
    // 0.1 + 0.2 !== 0.3 territory: these must not be decided by IEEE754.
    expect(meetsRatio('0.3', '0.30000000', '1.0')).toBe(true);
    expect(meetsRatio('0.2999999', '0.3', '1.0')).toBe(false);
  });

  it('holds at large supply where float loses integer precision', () => {
    expect(meetsRatio('9007199254740993', '9007199254740993', '1.0')).toBe(true);
  });

  it('an empty reserve never backs a live supply', () => {
    expect(meetsRatio('0', '1', '1.0')).toBe(false);
  });
});

describe('displayRatio — presentation only', () => {
  it('formats to 6dp', () => {
    expect(displayRatio('1050', '1000')).toBe('1.050000');
  });

  it('reports N/A rather than a misleading zero when nothing is outstanding', () => {
    // "0" would read as "no backing"; N/A is the truth — there is nothing to back.
    expect(displayRatio('1000', '0')).toBe('N/A');
  });
});
