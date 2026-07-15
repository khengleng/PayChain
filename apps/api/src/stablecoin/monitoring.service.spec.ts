import { MonitoringService, runRules } from './monitoring.service';

describe('monitoring runRules (§29)', () => {
  it('flags a sanctions match as CRITICAL', () => {
    const hits = runRules({ subjectType: 'wallet', subjectReference: 'w1', sanctionsMatch: true });
    expect(hits).toEqual([expect.objectContaining({ ruleKey: 'sanctions_match', severity: 'CRITICAL' })]);
  });

  it('flags a large amount as HIGH', () => {
    const hits = runRules({ subjectType: 'transaction', subjectReference: 't1', amount: '200000' });
    expect(hits.some((h) => h.ruleKey === 'large_amount' && h.severity === 'HIGH')).toBe(true);
  });

  it('flags structuring just below the threshold', () => {
    const hits = runRules({ subjectType: 'transaction', subjectReference: 't1', amount: '9500' });
    expect(hits.some((h) => h.ruleKey === 'structuring')).toBe(true);
  });

  it('returns no hits for a normal transaction', () => {
    expect(runRules({ subjectType: 'transaction', subjectReference: 't1', amount: '50' })).toEqual([]);
  });
});

describe('MonitoringService.evaluate', () => {
  it('applies an automated HOLD on CRITICAL and records a reason (never silent §29)', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'al1', holdApplied: true });
    const record = jest.fn();
    const prisma = { monitoringAlert: { create } } as never;
    const svc = new MonitoringService(prisma, { record } as never);

    const res = await svc.evaluate({ tenantId: 't1', clientId: 'sys', scopes: [] }, {
      subjectType: 'wallet',
      subjectReference: 'w1',
      sanctionsMatch: true,
    });

    expect(res.holds).toBe(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'HELD', holdApplied: true, reason: expect.any(String) }) }),
    );
    expect(record).toHaveBeenCalled(); // audited, not silent
  });
});
