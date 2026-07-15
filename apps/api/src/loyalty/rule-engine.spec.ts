import { ConfigRuleEngine } from './rule-engine';

describe('ConfigRuleEngine', () => {
  const weekday = '2026-07-15T10:00:00.000Z'; // Wednesday
  const weekend = '2026-07-18T10:00:00.000Z'; // Saturday

  it('applies the base rate', () => {
    const engine = new ConfigRuleEngine({ baseRatePerUnit: 10 });
    const res = engine.evaluateEarn({ spendAmount: '5', currency: 'USD', timestampIso: weekday });
    expect(res.points).toBe('50');
    expect(res.appliedRules).toEqual(['base']);
  });

  it('applies a weekend multiplier', () => {
    const engine = new ConfigRuleEngine({ baseRatePerUnit: 10, weekendMultiplier: 2 });
    const res = engine.evaluateEarn({ spendAmount: '5', currency: 'USD', timestampIso: weekend });
    expect(res.points).toBe('100');
    expect(res.appliedRules).toContain('weekend');
  });

  it('applies a merchant multiplier', () => {
    const engine = new ConfigRuleEngine({
      baseRatePerUnit: 10,
      merchantMultipliers: { m1: 3 },
    });
    const res = engine.evaluateEarn({
      spendAmount: '5',
      currency: 'USD',
      merchantId: 'm1',
      timestampIso: weekday,
    });
    expect(res.points).toBe('150');
    expect(res.appliedRules).toContain('merchant:m1');
  });

  it('caps points at the configured maximum', () => {
    const engine = new ConfigRuleEngine({ baseRatePerUnit: 10, maxPointsPerEvent: 100 });
    const res = engine.evaluateEarn({ spendAmount: '50', currency: 'USD', timestampIso: weekday });
    expect(res.points).toBe('100');
    expect(res.appliedRules).toContain('cap');
  });

  it('floors fractional points to whole numbers', () => {
    const engine = new ConfigRuleEngine({ baseRatePerUnit: 1 });
    const res = engine.evaluateEarn({ spendAmount: '2.75', currency: 'USD', timestampIso: weekday });
    expect(res.points).toBe('2');
  });

  it('rejects a negative spend', () => {
    const engine = new ConfigRuleEngine({ baseRatePerUnit: 10 });
    expect(() =>
      engine.evaluateEarn({ spendAmount: '-1', currency: 'USD', timestampIso: weekday }),
    ).toThrow();
  });
});
