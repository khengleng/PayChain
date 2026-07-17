import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReserveService } from './reserve.service';
import type { AuthContext } from '../auth/auth-context';

const auth = (clientId: string): AuthContext => ({
  tenantId: 't1',
  clientId,
  scopes: [],
});

/**
 * In-memory stand-in for the reserve tables. `$transaction(fn)` runs the callback against the
 * same store, which is enough to exercise the claim-then-apply ordering; the real atomicity is
 * Postgres's, and the concurrency test below drives the same compare-and-set the DB enforces.
 */
function fakePrisma(accountBalance = '1000') {
  const account = { id: 'ra1', tenantId: 't1', assetId: 'a1', balance: accountBalance, status: 'ACTIVE' };
  const movements: Record<string, Record<string, unknown>> = {};
  let seq = 0;

  const client = {
    account,
    movements,
    reserveAccount: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === account.id ? { ...account } : null,
      update: async ({ data }: { data: { balance: string } }) => {
        account.balance = data.balance;
        return { ...account };
      },
      findMany: async () => [{ balance: account.balance }],
    },
    reserveMovement: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        seq += 1;
        const id = `mv${seq}`;
        movements[id] = { id, ...data };
        return { ...movements[id] };
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        movements[where.id] ? { ...movements[where.id] } : null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: string };
        data: Record<string, unknown>;
      }) => {
        const m = movements[where.id];
        if (!m || m.status !== where.status) return { count: 0 };
        movements[where.id] = { ...m, ...data };
        return { count: 1 };
      },
    },
    stablecoinConfig: { findFirst: async () => ({ reserveRatioTarget: '1.0' }) },
    stablecoinMintRequest: { findMany: async () => [] },
    stablecoinRedemption: { findMany: async () => [] },
    reserveSnapshot: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'snap1', ...data }),
      findFirst: async () => null,
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
  };
  return client;
}

function build(prisma: ReturnType<typeof fakePrisma>) {
  const audit = { record: jest.fn() };
  return {
    svc: new ReserveService(prisma as never, audit as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never),
    audit,
  };
}

describe('ReserveService — maker-checker on reserve movements (§23)', () => {
  it('a requested movement moves no money until approved', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);

    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500' },
      'corr',
    );

    expect(mv.status).toBe('PENDING_APPROVAL');
    expect(prisma.account.balance).toBe('1000'); // unchanged — this is the whole point
    expect(mv.approvedBy).toBeUndefined();
  });

  it('applies the balance only on approval, and records who approved it', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500' },
      'corr',
    );

    const applied = await svc.approveMovement(auth('checker'), mv.id, 'corr');

    expect(applied?.status).toBe('APPLIED');
    expect(applied?.approvedBy).toBe('checker');
    expect(applied?.balanceAfter).toBe('1500');
    expect(prisma.account.balance).toBe('1500');
  });

  it('REFUSES self-approval — the requester cannot approve their own movement', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '999999' },
      'corr',
    );

    await expect(svc.approveMovement(auth('maker'), mv.id, 'corr')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.account.balance).toBe('1000'); // no inflation
  });

  it('REFUSES self-rejection too, so a maker cannot quietly bury their own request', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'DEBIT', amount: '10' },
      'corr',
    );
    await expect(svc.rejectMovement(auth('maker'), mv.id, 'oops', 'corr')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('never accepts approvedBy from the requester — identity comes from the approver', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    // Even if a caller smuggles approvedBy into the payload, it must not be persisted.
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500', approvedBy: 'someone-else' } as never,
      'corr',
    );
    expect(mv.approvedBy).toBeUndefined();
    expect(mv.status).toBe('PENDING_APPROVAL');
  });

  it('cannot be applied twice — a concurrent second approval loses the compare-and-set', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500' },
      'corr',
    );

    await svc.approveMovement(auth('checker'), mv.id, 'corr');
    await expect(svc.approveMovement(auth('checker2'), mv.id, 'corr')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.account.balance).toBe('1500'); // credited once, not twice
  });

  it('refuses a rejected movement being approved later', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500' },
      'corr',
    );
    await svc.rejectMovement(auth('checker'), mv.id, 'not funded', 'corr');
    await expect(svc.approveMovement(auth('checker'), mv.id, 'corr')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.account.balance).toBe('1000');
  });

  it('refuses a debit that would take the reserve negative', async () => {
    const prisma = fakePrisma('100');
    const { svc } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'DEBIT', amount: '500' },
      'corr',
    );
    await expect(svc.approveMovement(auth('checker'), mv.id, 'corr')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.account.balance).toBe('100');
  });

  it('rejects a movement against another tenant\'s reserve account', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const other: AuthContext = { tenantId: 't2', clientId: 'x', scopes: [] };
    await expect(
      svc.requestMovement(other, { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '5' }, 'corr'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('audits the applied movement with before/after balances', async () => {
    const prisma = fakePrisma('1000');
    const { svc, audit } = build(prisma);
    const mv = await svc.requestMovement(
      auth('maker'),
      { reserveAccountId: 'ra1', direction: 'CREDIT', amount: '500' },
      'corr',
    );
    await svc.approveMovement(auth('checker'), mv.id, 'corr');

    const applied = audit.record.mock.calls.find((c) => c[0].action === 'reserve.movement.applied');
    expect(applied?.[0].metadata).toMatchObject({
      balanceBefore: '1000',
      balanceAfter: '1500',
      requestedBy: 'maker',
    });
  });
});

describe('ReserveService — snapshots are evidence (§24)', () => {
  it('commits the figures to a snapshotHash', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    const snap = (await svc.snapshot('t1', 'a1')) as unknown as Record<string, string>;
    expect(snap.snapshotHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('preserves N/A rather than reporting a zero ratio for zero supply', async () => {
    const prisma = fakePrisma('1000');
    const { svc } = build(prisma);
    // No mints/redemptions → supply 0. "0" would read as "no backing"; N/A is the truth.
    const snap = (await svc.snapshot('t1', 'a1')) as unknown as Record<string, string>;
    expect(snap.reserveRatio).toBe('N/A');
  });
});

/**
 * §23: "Do not mint on stale or unreconciled reserve data."
 *
 * This was unimplemented AND the service docstring claimed the mint saga checked it. There was no
 * staleness concept anywhere: takenAt was written and never read, STALE_RESERVE_DATA was declared
 * and never produced. A reserve balance is an assertion, not an observation — with no custodian
 * feed, the newest snapshot's age IS the freshness of the figure.
 */
describe('ReserveService.assertFresh (§23)', () => {
  function withSnapshot(takenAt: Date | null, maxHours = 24) {
    const prisma = {
      reserveSnapshot: { findFirst: async () => (takenAt ? { takenAt } : null) },
    } as never;
    return new ReserveService(prisma, { record: jest.fn() } as never, {
      RESERVE_MAX_STALENESS_HOURS: maxHours,
    } as never);
  }
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

  it('REFUSES when the reserve has never been snapshotted', async () => {
    // Never-verified and unverifiable are the same thing to a token holder — this must not pass.
    await expect(withSnapshot(null).assertFresh('t1', 'a1')).rejects.toThrow(/never been snapshotted/);
  });

  it('REFUSES when the newest snapshot is older than the limit', async () => {
    await expect(withSnapshot(hoursAgo(30)).assertFresh('t1', 'a1')).rejects.toThrow(/stale/i);
  });

  it('reports how stale the data actually is, so the refusal is actionable', async () => {
    await expect(withSnapshot(hoursAgo(48)).assertFresh('t1', 'a1')).rejects.toThrow(/48\.0h ago/);
  });

  it('ALLOWS a recent snapshot', async () => {
    await expect(withSnapshot(hoursAgo(1)).assertFresh('t1', 'a1')).resolves.toBeUndefined();
  });

  it('honours the configured window rather than a hardcoded one', async () => {
    // 2h old: stale under a 1h policy, fresh under the 24h default.
    await expect(withSnapshot(hoursAgo(2), 1).assertFresh('t1', 'a1')).rejects.toThrow(/stale/i);
    await expect(withSnapshot(hoursAgo(2), 24).assertFresh('t1', 'a1')).resolves.toBeUndefined();
  });
});
