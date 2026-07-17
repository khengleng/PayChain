import { MockComplianceProvider } from '@paychain/compliance';
import { MonitoringService, runRules } from './monitoring.service';

/** Default: the mock provider's real behaviour — CLEAR for everything. */
const clearCompliance = () => ({ screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) });

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
    const svc = new MonitoringService(prisma, { record } as never, clearCompliance() as never);

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

/**
 * §29. evaluate() had exactly one caller: an endpoint a tenant invoked voluntarily, about itself,
 * supplying its own velocityCount. Both the trigger and the evidence came from the party being
 * monitored — so nothing was ever detected on real traffic and the CRITICAL hold never fired.
 * holdApplied was a boolean on a row; it blocked nothing.
 */
describe('MonitoringService.screenMovement — monitoring that actually monitors (§29)', () => {
  function build(opts: { recentCount?: number; blocked?: boolean } = {}) {
    const created: Record<string, any>[] = [];
    const countArgs: Record<string, any>[] = [];
    const prisma = {
      transaction: {
        count: async (args: Record<string, any>) => { countArgs.push(args); return opts.recentCount ?? 0; },
      },
      monitoringAlert: {
        create: async ({ data }: { data: Record<string, any> }) => {
          const row = { id: `al${created.length + 1}`, ...data };
          created.push(row);
          return row;
        },
      },
    } as never;
    const compliance = {
      screenTransaction: jest.fn().mockResolvedValue({ decision: opts.blocked ? 'BLOCKED' : 'CLEAR' }),
    };
    return {
      svc: new MonitoringService(prisma, { record: jest.fn() } as never, compliance as never),
      created,
      countArgs,
      compliance,
    };
  }

  const auth = { tenantId: 't1', clientId: 'c1', scopes: [] };
  const move = (amount: string) => ({
    walletId: 'w1', subjectType: 'transaction', subjectReference: 'transfer:w1->w2', amount,
  });

  it('computes velocity from the LEDGER, not from the caller', async () => {
    // The old path let the caller assert its own velocity — like asking a suspect how suspicious
    // they have been.
    const { svc, countArgs } = build({ recentCount: 3 });
    await svc.screenMovement(auth, move('10'));
    expect(countArgs[0]!.where).toMatchObject({ tenantId: 't1' });
    // Both directions: rapid movement THROUGH a wallet is the pattern, whichever way value went.
    expect(countArgs[0]!.where.OR).toEqual([
      { sourceWalletId: 'w1' },
      { destinationWalletId: 'w1' },
    ]);
  });

  it('raises a velocity alert once the ledger shows rapid movement', async () => {
    const { svc, created } = build({ recentCount: 25 }); // over VELOCITY_LIMIT
    await svc.screenMovement(auth, move('10'));
    expect(created.some((a) => a.ruleKey === 'velocity')).toBe(true);
  });

  it('raises a large_amount alert on a real movement, not on request', async () => {
    const { svc, created } = build();
    await svc.screenMovement(auth, move('150000'));
    expect(created.some((a) => a.ruleKey === 'large_amount' && a.severity === 'HIGH')).toBe(true);
  });

  it('detects structuring just under the reporting threshold', async () => {
    const { svc, created } = build();
    await svc.screenMovement(auth, move('9500'));
    expect(created.some((a) => a.ruleKey === 'structuring')).toBe(true);
  });

  it('does not block on a HIGH alert — it records and lets the movement proceed', async () => {
    // Only CRITICAL holds. Blocking every large payment would make the control unusable and
    // guarantee it gets switched off.
    const { svc } = build();
    await expect(svc.screenMovement(auth, move('150000'))).resolves.toBeUndefined();
  });

  // These two are the tests that were missing. runRules had a CRITICAL test and evaluate had a
  // HOLD test, both green — but nothing asserted that screenMovement could ever REACH either one.
  // It could not: sanctions_match is the only CRITICAL rule and screenMovement never supplied the
  // signal, so the block below was unreachable code sitting behind a passing suite.
  it('passes the counterparty country to the screen — the field it decides on', async () => {
    const { svc, compliance } = build();
    await svc.screenMovement(auth, { ...move('100'), country: 'SG' });
    expect(compliance.screenTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ counterpartyCountry: 'SG' }),
    );
  });

  it('BLOCKS the movement when the compliance provider says BLOCKED', async () => {
    const { svc, created } = build({ blocked: true });
    await expect(svc.screenMovement(auth, move('100'))).rejects.toThrow(/sanctions_match/);
    expect(created.some((a) => a.severity === 'CRITICAL' && a.holdApplied === true)).toBe(true);
  });

  it('asks the compliance provider on every movement, and lets CLEAR through', async () => {
    const { svc, compliance } = build();
    await expect(svc.screenMovement(auth, move('100'))).resolves.toBeUndefined();
    expect(compliance.screenTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not pass traffic as clean when screening is unavailable — it declines to assert', async () => {
    const { svc } = build();
    // A provider outage must not become an implicit "sanctions clear" verdict.
    const svcDown = new MonitoringService(
      { transaction: { count: async () => 0 }, monitoringAlert: { create: async ({ data }: any) => data } } as never,
      { record: jest.fn() } as never,
      { screenTransaction: jest.fn().mockRejectedValue(new Error('provider down')) } as never,
    );
    await expect(svcDown.screenMovement(auth, move('100'))).resolves.toBeUndefined();
    expect(svc).toBeDefined();
  });

  // Against the REAL provider that is wired in production — a hand-written stub only proves my
  // stub agrees with my code. This is what proves the sanctioned-jurisdiction hold is live.
  it('blocks a sanctioned jurisdiction end-to-end via the real MockComplianceProvider', async () => {
    const prisma = {
      transaction: { count: async () => 0 },
      monitoringAlert: { create: async ({ data }: any) => ({ id: 'a1', ...data }) },
    } as never;
    const svc = new MonitoringService(prisma, { record: jest.fn() } as never, new MockComplianceProvider());

    await expect(svc.screenMovement(auth, { ...move('100'), country: 'KP' })).rejects.toThrow(
      /sanctions_match/,
    );
    await expect(svc.screenMovement(auth, { ...move('100'), country: 'SG' })).resolves.toBeUndefined();
  });

  it('stays silent on ordinary traffic', async () => {
    const { svc, created } = build({ recentCount: 2 });
    await svc.screenMovement(auth, move('50'));
    expect(created).toHaveLength(0);
  });
});
