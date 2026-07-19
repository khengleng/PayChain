import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SpendService } from './spend.service';
import type { AuthContext } from '../auth/auth-context';

const auth: AuthContext = { tenantId: 't1', clientId: 'pos', scopes: [] };

const ASSET = {
  id: 'a1',
  tenantId: 't1',
  assetCode: 'MPTS',
  issuerPublicKey: 'GISSUER',
  stablecoinConfig: { lifecycleState: 'ACTIVE' },
};
const WALLET = {
  id: 'w1',
  tenantId: 't1',
  status: 'ACTIVE',
  stellarAccountId: 'GHOLDER',
  stellarSecretEnc: 'enc',
};

function deps(over: {
  prisma?: unknown;
  flags?: unknown;
  chain?: unknown;
  escrow?: unknown;
} = {}) {
  const audit = { record: jest.fn() };
  const balances = { refreshFromChain: jest.fn().mockResolvedValue(undefined) };
  const svc = new SpendService(
    (over.prisma ?? {}) as never,
    { decrypt: () => 'S' } as never,
    audit as never,
    (over.flags ?? { requireEnabled: jest.fn().mockResolvedValue(undefined) }) as never,
    (over.chain ?? { burnAsset: jest.fn(), getTransaction: jest.fn() }) as never,
    (over.escrow ?? { assertSpendable: jest.fn().mockResolvedValue(undefined) }) as never,
    balances as never,
    { consume: jest.fn().mockResolvedValue(undefined) } as never,
  );
  return { svc, audit, balances };
}

// A stateful stand-in for the stablecoin_spends row, exercising the claim-then-write ordering.
function statefulPrisma(initial: Record<string, unknown>, wallet: Record<string, unknown> | null = WALLET) {
  let rec: Record<string, unknown> = { ...initial };
  return {
    store: () => rec,
    stablecoinSpend: {
      findUnique: async () => ({ ...rec }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        rec = { ...rec, ...data };
        return { ...rec };
      },
      updateMany: async ({ where, data }: { where: { status: string }; data: { status: string } }) => {
        if (rec.status === where.status) {
          rec = { ...rec, ...data };
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    asset: { findUnique: async () => ({ ...ASSET }) },
    wallet: { findUnique: async () => wallet },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

describe('SpendService.request (spend points for goods)', () => {
  function requestPrisma() {
    const created: Record<string, unknown>[] = [];
    return {
      created,
      asset: { findUnique: async () => ({ ...ASSET }) },
      wallet: { findUnique: async () => ({ ...WALLET }) },
      stablecoinSpend: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: 'sp1', ...data };
          created.push(row);
          return row;
        },
      },
    };
  }

  it('creates a REQUESTED spend, checks spendability first, and mints nothing', async () => {
    const prisma = requestPrisma();
    const escrow = { assertSpendable: jest.fn().mockResolvedValue(undefined) };
    const { svc, audit } = deps({ prisma, escrow });

    const out = await svc.request(auth, 'a1', { walletId: 'w1', amount: '250', orderReference: 'ORD-9' }, 'corr');

    expect(out.status).toBe('REQUESTED');
    expect(out.amount).toBe('250');
    expect(out.orderReference).toBe('ORD-9');
    // Spendability is asserted against the escrow-aware balance BEFORE the row is created.
    expect(escrow.assertSpendable).toHaveBeenCalledWith(
      expect.objectContaining({ walletId: 'w1', assetId: 'a1', assetCode: 'MPTS', amount: '250' }),
    );
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'stablecoin.spend.request' }));
  });

  it('is gated by the spend flag (refuses when disabled)', async () => {
    const flags = { requireEnabled: jest.fn().mockRejectedValue(new ForbiddenException('off')) };
    const prisma = requestPrisma();
    const { svc } = deps({ prisma, flags });
    await expect(
      svc.request(auth, 'a1', { walletId: 'w1', amount: '1' }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.created).toHaveLength(0);
  });

  it('refuses when the wallet lacks enough NON-escrowed balance (no row created)', async () => {
    const prisma = requestPrisma();
    const escrow = { assertSpendable: jest.fn().mockRejectedValue(new BadRequestException('escrowed')) };
    const { svc } = deps({ prisma, escrow });
    await expect(
      svc.request(auth, 'a1', { walletId: 'w1', amount: '999' }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.created).toHaveLength(0);
  });

  it("refuses another tenant's wallet", async () => {
    const prisma = { ...requestPrisma(), wallet: { findUnique: async () => ({ ...WALLET, tenantId: 'OTHER' }) } };
    const { svc } = deps({ prisma });
    await expect(
      svc.request(auth, 'a1', { walletId: 'w1', amount: '1' }, 'corr'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses a FROZEN wallet', async () => {
    const prisma = { ...requestPrisma(), wallet: { findUnique: async () => ({ ...WALLET, status: 'FROZEN' }) } };
    const { svc } = deps({ prisma });
    await expect(svc.request(auth, 'a1', { walletId: 'w1', amount: '1' }, 'corr')).rejects.toThrow(/FROZEN/);
  });
});

describe('SpendService saga — burn reduces supply only once confirmed', () => {
  it('burns exactly once, records the burn, and completes only after on-chain confirmation', async () => {
    const prisma = statefulPrisma({
      id: 'sp1', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '100',
      status: 'REQUESTED', correlationId: 'c',
    });
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'B' });
    const getTransaction = jest
      .fn()
      .mockResolvedValueOnce({ status: 'pending' }) // not yet confirmed → stays BURN_PENDING
      .mockResolvedValueOnce({ status: 'confirmed' });
    const { svc, balances } = deps({ prisma, chain: { burnAsset, getTransaction } });

    await svc.advance('t1', 'sp1'); // REQUESTED -> BURN_PENDING (broadcast once)
    expect(prisma.store().status).toBe('BURN_PENDING');
    expect(prisma.store().burnHash).toBe('B');
    expect(burnAsset).toHaveBeenCalledTimes(1);
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'ASSET_BURNED', status: 'PENDING_CONFIRMATION' }) }),
    );

    await svc.advance('t1', 'sp1'); // burn still pending → no state change, no re-burn
    expect(prisma.store().status).toBe('BURN_PENDING');

    await svc.advance('t1', 'sp1'); // confirmed
    expect(prisma.store().status).toBe('BURN_CONFIRMED');
    expect(balances.refreshFromChain).toHaveBeenCalled(); // cache refreshed post-burn (no BALANCE_DRIFT)

    await svc.advance('t1', 'sp1'); // BURN_CONFIRMED -> COMPLETED
    expect(prisma.store().status).toBe('COMPLETED');

    expect(burnAsset).toHaveBeenCalledTimes(1); // never double-burned
  });

  it('routes a BURN_PENDING row with no burn hash to MANUAL_REVIEW (never re-burns blindly)', async () => {
    const prisma = statefulPrisma({
      id: 'sp2', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10',
      status: 'BURN_PENDING', correlationId: 'c', // burnHash absent — crashed after claim
    });
    const burnAsset = jest.fn();
    const { svc } = deps({ prisma, chain: { burnAsset, getTransaction: jest.fn() } });
    const r = await svc.advance('t1', 'sp2');
    expect(r.status).toBe('MANUAL_REVIEW');
    expect(burnAsset).not.toHaveBeenCalled();
  });

  it('marks the spend FAILED when the burn fails on chain', async () => {
    const prisma = statefulPrisma({
      id: 'sp3', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10',
      status: 'BURN_PENDING', burnHash: 'B', correlationId: 'c',
    });
    const getTransaction = jest.fn().mockResolvedValue({ status: 'failed' });
    const { svc } = deps({ prisma, chain: { burnAsset: jest.fn(), getTransaction } });
    const r = await svc.advance('t1', 'sp3');
    expect(r.status).toBe('FAILED');
  });

  it("REFUSES to burn from another tenant's wallet", async () => {
    const prisma = statefulPrisma(
      { id: 'sp4', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10', status: 'REQUESTED', correlationId: 'c' },
      { ...WALLET, tenantId: 'OTHER' },
    );
    const { svc } = deps({ prisma, chain: { burnAsset: jest.fn(), getTransaction: jest.fn() } });
    await expect(svc.advance('t1', 'sp4')).rejects.toThrow(/Spender wallet not found/);
  });

  it('REFUSES to burn from a FROZEN wallet — freeze reaches the burn path too', async () => {
    const prisma = statefulPrisma(
      { id: 'sp5', tenantId: 't1', assetId: 'a1', walletId: 'w1', amount: '10', status: 'REQUESTED', correlationId: 'c' },
      { ...WALLET, status: 'FROZEN' },
    );
    const { svc } = deps({ prisma, chain: { burnAsset: jest.fn(), getTransaction: jest.fn() } });
    await expect(svc.advance('t1', 'sp5')).rejects.toThrow(/FROZEN/);
  });
});
