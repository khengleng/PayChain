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
    stablecoinSpend: { findMany: async () => [] },
    stablecoinExchange: { findMany: async () => [] },
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
    svc: new ReserveService(prisma as never, audit as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never, { isEnabled: jest.fn().mockResolvedValue(false) } as never),
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
    } as never, { isEnabled: jest.fn().mockResolvedValue(false) } as never);
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

describe('§23 liabilities — figures that were declared and never computed', () => {
  const prismaFor = (opts: {
    accounts?: string[];
    minted?: Array<{ amount: string; status: string }>;
    redemptions?: Array<{ amount: string; status: string }>;
    spends?: Array<{ amount: string; status: string }>;
    exchanges?: Array<{ fromAmount: string; status: string }>;
  }) =>
    ({
      reserveAccount: {
        findMany: async () => (opts.accounts ?? []).map((balance) => ({ balance })),
      },
      stablecoinConfig: { findFirst: async () => null }, // unitValue defaults "1"
      stablecoinMintRequest: {
        findMany: async ({ where }: any) =>
          (opts.minted ?? []).filter((m) => where.status.in.includes(m.status)),
      },
      stablecoinRedemption: {
        findMany: async ({ where }: any) =>
          (opts.redemptions ?? []).filter((r) => where.status.in.includes(r.status)),
      },
      stablecoinSpend: {
        findMany: async ({ where }: any) =>
          (opts.spends ?? []).filter((s) => where.status.in.includes(s.status)),
      },
      stablecoinExchange: {
        findMany: async ({ where }: any) =>
          (opts.exchanges ?? []).filter((x) => where.status.in.includes(x.status)),
      },
    }) as never;

  const svc = (prisma: never) => new ReserveService(prisma, { record: jest.fn() } as never, {} as never, { isEnabled: jest.fn().mockResolvedValue(false) } as never);

  it('counts unburned tokens as unredeemed liability', async () => {
    const state = await svc(
      prismaFor({
        accounts: ['1000'],
        minted: [{ amount: '500', status: 'CONFIRMED' }],
        redemptions: [{ amount: '200', status: 'COMPLETED' }],
      }),
    ).getState('t1', 'a1');
    expect(state.outstandingSupply).toBe('300');
    expect(state.unredeemedLiability).toBe('300');
  });

  it('subtracts confirmed spend-for-goods burns from supply, exactly like redemption burns', async () => {
    // 1000 minted, 200 redeemed (fiat cash-out), 150 spent on goods → 650 outstanding. A spend
    // still BURN_PENDING must NOT count yet (its tokens are still circulating), or a burned point
    // would be counted as backed supply — silent under-collateralization.
    const state = await svc(
      prismaFor({
        accounts: ['1000'],
        minted: [{ amount: '1000', status: 'CONFIRMED' }],
        redemptions: [{ amount: '200', status: 'COMPLETED' }],
        spends: [
          { amount: '100', status: 'BURN_CONFIRMED' },
          { amount: '50', status: 'COMPLETED' },
          { amount: '999', status: 'BURN_PENDING' }, // submitted, not yet off-chain — excluded
          { amount: '777', status: 'REQUESTED' }, // not burned at all — excluded
        ],
      }),
    ).getState('t1', 'a1');
    expect(state.outstandingSupply).toBe('650');
    expect(state.unredeemedLiability).toBe('650');
    expect(state.backingLiability).toBe('650'); // unitValue "1"
  });

  it('subtracts confirmed cross-peg exchange SOURCE burns from the source coin supply', async () => {
    // 1000 minted; this coin is the SOURCE of exchanges totalling 300 burned. A burn still
    // SOURCE_BURN_PENDING is excluded (tokens circulating); a COMPENSATED swap is excluded (source
    // re-issued). So 100 + 150 + 50 = 300 subtracted → 700 outstanding.
    const state = await svc(
      prismaFor({
        accounts: ['1000'],
        minted: [{ amount: '1000', status: 'CONFIRMED' }],
        exchanges: [
          { fromAmount: '100', status: 'SOURCE_BURNED' },
          { fromAmount: '150', status: 'DEST_MINT_PENDING' },
          { fromAmount: '50', status: 'COMPLETED' },
          { fromAmount: '999', status: 'SOURCE_BURN_PENDING' }, // not yet off-chain — excluded
          { fromAmount: '777', status: 'COMPENSATED' }, // source re-issued — excluded
        ],
      }),
    ).getState('t1', 'a1');
    expect(state.outstandingSupply).toBe('700');
    expect(state.backingLiability).toBe('700');
  });

  it('counts in-flight mints as pending mint liability, and excludes ones that will never land', async () => {
    const state = await svc(
      prismaFor({
        accounts: ['1000'],
        minted: [
          { amount: '100', status: 'APPROVED' },
          { amount: '50', status: 'SUBMITTED' },
          { amount: '999', status: 'REJECTED' }, // never becomes supply
          { amount: '777', status: 'CONFIRMED' }, // already IS supply — would double count
        ],
      }),
    ).getState('t1', 'a1');
    expect(state.pendingMintLiability).toBe('150');
  });

  it('counts escrowed redemptions as pending, and stops once the burn confirms', async () => {
    const state = await svc(
      prismaFor({
        accounts: ['1000'],
        minted: [{ amount: '1000', status: 'CONFIRMED' }],
        redemptions: [
          { amount: '10', status: 'ESCROW_HELD' },
          { amount: '20', status: 'FIAT_PAYOUT_PENDING' },
          { amount: '30', status: 'BURN_CONFIRMED' }, // tokens gone, obligation discharged
          { amount: '40', status: 'REQUESTED' }, // nothing committed yet
        ],
      }),
    ).getState('t1', 'a1');
    expect(state.pendingRedemptionLiability).toBe('30');
  });

  it('seals the liabilities into snapshotHash, not merely alongside it', async () => {
    // Takes two real snapshots differing ONLY in a liability figure and compares the hashes.
    // The earlier version of this test asserted the two STATES differed, which would have passed
    // just as happily with the liabilities left out of the hash entirely — it tested nothing it
    // was named for.
    const hashFor = async (redemptions: Array<{ amount: string; status: string }>) => {
      let captured: any;
      const prisma = {
        ...(prismaFor({ accounts: ['1000'], minted: [{ amount: '100', status: 'CONFIRMED' }], redemptions }) as any),
        stablecoinConfig: { findFirst: async () => ({ reserveRatioTarget: '1.0' }) },
        reserveSnapshot: {
          create: async ({ data }: any) => {
            captured = data;
            return data;
          },
        },
      } as never;
      await svc(prisma).snapshot('t1', 'a1', { targetRatio: '1.0' });
      return captured;
    };

    const clean = await hashFor([]);
    const owing = await hashFor([{ amount: '10', status: 'ESCROW_HELD' }]);

    expect(clean.pendingRedemptionLiability).toBe('0');
    expect(owing.pendingRedemptionLiability).toBe('10');
    // Same balance, same supply, same ratio — different obligations. The seal must notice.
    expect(clean.reserveBalance).toBe(owing.reserveBalance);
    expect(clean.outstandingSupply).toBe(owing.outstandingSupply);
    expect(clean.snapshotHash).not.toBe(owing.snapshotHash);
  });
});

describe('ReserveService — trustee-authoritative reserve (§24)', () => {
  function build(flagOn: boolean, trusteeSnapshot: { reserveBalance: string } | null, unitValue = '1') {
    const prisma = {
      reserveAccount: { findMany: async () => [{ balance: '10' }] }, // internal ledger sum = 10
      reserveSnapshot: { findFirst: async () => trusteeSnapshot },
      stablecoinConfig: { findFirst: async () => ({ reserveRatioTarget: '1.0', unitValue }) },
      stablecoinMintRequest: { findMany: async () => [{ amount: '1000' }] }, // 1000 coins minted
      stablecoinRedemption: { findMany: async () => [] },
      stablecoinSpend: { findMany: async () => [] },
      stablecoinExchange: { findMany: async () => [] },
    } as never;
    const flags = { isEnabled: jest.fn().mockResolvedValue(flagOn) } as never;
    return new ReserveService(prisma, { record: jest.fn() } as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never, flags);
  }

  it('flag OFF: uses the internal ledger sum', async () => {
    const state = await build(false, { reserveBalance: '999' }).getState('t1', 'a1', '1.0');
    expect(state.reserveBalance).toBe('10');
  });

  it('flag ON: uses the trustee-attested figure, not the internal sum', async () => {
    const state = await build(true, { reserveBalance: '999' }).getState('t1', 'a1', '1.0');
    expect(state.reserveBalance).toBe('999');
  });

  it('flag ON + no fresh trustee snapshot: fails closed to 0 (a breach)', async () => {
    const state = await build(true, null).getState('t1', 'a1', '1.0');
    expect(state.reserveBalance).toBe('0');
  });
});

describe('ReserveService — per-coin unit value backing (§23)', () => {
  // reserve figure = internal ledger sum; backing needed = supply × unitValue × target(1.0).
  function build(reserveBalance: string, supplyCoins: string, unitValue: string) {
    const prisma = {
      reserveAccount: { findMany: async () => [{ balance: reserveBalance }] },
      reserveSnapshot: { findFirst: async () => null },
      stablecoinConfig: { findFirst: async () => ({ reserveRatioTarget: '1.0', unitValue }) },
      stablecoinMintRequest: { findMany: async () => [{ amount: supplyCoins }] },
      stablecoinRedemption: { findMany: async () => [] },
      stablecoinSpend: { findMany: async () => [] },
      stablecoinExchange: { findMany: async () => [] },
    } as never;
    // Authoritative-reserve flag OFF so the figure is the internal sum; unit-value is independent.
    const flags = { isEnabled: jest.fn().mockResolvedValue(false) } as never;
    return new ReserveService(prisma, { record: jest.fn() } as never, { RESERVE_MAX_STALENESS_HOURS: 24 } as never, flags);
  }

  it('unitValue "1": backing = supply (unchanged behaviour)', async () => {
    const s = await build('1000', '1000', '1').getState('t', 'a', '1.0');
    expect(s.backingLiability).toBe('1000');
    expect(s.shortfall).toBe(false); // reserve 1000 >= 1000
    expect((await build('999', '1000', '1').getState('t', 'a', '1.0')).shortfall).toBe(true);
  });

  it('unitValue "0.01": 1000 coins need $10 of reserve', async () => {
    const ok = await build('10', '1000', '0.01').getState('t', 'a', '1.0');
    expect(ok.backingLiability).toBe('10');
    expect(ok.shortfall).toBe(false); // reserve $10 >= $10
    const short = await build('9.99', '1000', '0.01').getState('t', 'a', '1.0');
    expect(short.shortfall).toBe(true); // reserve $9.99 < $10
  });

  it('unitValue "100" (KHR): 1000 coins need 100000 KHR of reserve', async () => {
    expect((await build('100000', '1000', '100').getState('t', 'a', '1.0')).shortfall).toBe(false);
    expect((await build('99999', '1000', '100').getState('t', 'a', '1.0')).shortfall).toBe(true);
  });

  it('wouldBreachTarget applies unitValue to the projected supply', async () => {
    // 500 coins already, minting 500 more at $0.01 → need $10; reserve $10 → no breach; $9.99 → breach.
    const svc = build('10', '500', '0.01');
    expect((await svc.wouldBreachTarget('t', 'a', '500')).breach).toBe(false);
    const svc2 = build('9.99', '500', '0.01');
    expect((await svc2.wouldBreachTarget('t', 'a', '500')).breach).toBe(true);
  });
});
