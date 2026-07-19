import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import type { AuthContext } from '../auth/auth-context';

const auth: AuthContext = { tenantId: 't1', clientId: 'swapper', scopes: [] };

// FROM = KHR coin, 1 coin = 100 KHR. TO = USD coin, 1 coin = $0.01.
const FROM = {
  id: 'khr', tenantId: 't1', assetCode: 'KHRP', issuerPublicKey: 'GKHR', issuerSecretEnc: 'enck',
  stablecoinConfig: { lifecycleState: 'ACTIVE', unitValue: '100', referenceCurrency: 'KHR' },
};
const TO = {
  id: 'usd', tenantId: 't1', assetCode: 'USDX', issuerPublicKey: 'GUSD', issuerSecretEnc: 'encu',
  stablecoinConfig: { lifecycleState: 'ACTIVE', unitValue: '0.01', referenceCurrency: 'USD' },
};
const WALLET = { id: 'w1', tenantId: 't1', status: 'ACTIVE', stellarAccountId: 'GW', stellarSecretEnc: 'encw' };

function make(over: {
  prisma?: unknown;
  flags?: unknown;
  chain?: unknown;
  mint?: unknown;
  walletPolicy?: unknown;
  escrow?: unknown;
} = {}) {
  const audit = { record: jest.fn() };
  const svc = new ExchangeService(
    (over.prisma ?? {}) as never,
    { decrypt: () => 'S' } as never,
    audit as never,
    (over.flags ?? { requireEnabled: jest.fn().mockResolvedValue(undefined) }) as never,
    (over.chain ?? { burnAsset: jest.fn(), getTransaction: jest.fn(), issueAsset: jest.fn() }) as never,
    (over.mint ?? { assertMintAllowed: jest.fn().mockResolvedValue(undefined) }) as never,
    (over.walletPolicy ?? { assertAllowed: jest.fn().mockResolvedValue(undefined) }) as never,
    (over.escrow ?? { assertSpendable: jest.fn().mockResolvedValue(undefined) }) as never,
  );
  return { svc, audit };
}

// asset.findUnique returns FROM/TO by id (works for both loadActive include:config and loadAsset).
const assetsById = (over: { wallet?: Record<string, unknown> | null } = {}) => ({
  asset: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === 'khr' ? FROM : where.id === 'usd' ? TO : null) },
  wallet: { findUnique: async () => (over.wallet === undefined ? { ...WALLET } : over.wallet) },
});

describe('ExchangeService.quote — unit-value rebasing × FX rate', () => {
  function quotePrisma() {
    const created: Record<string, unknown>[] = [];
    return {
      created,
      ...assetsById(),
      stablecoinExchange: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: 'ex1', ...data };
          created.push(row);
          return row;
        },
      },
    };
  }

  it('prices a cross-currency swap from both unit values and the fx rate', async () => {
    // 1 KHR coin = 100 KHR; at 1 KHR = 0.00025 USD → 0.025 USD; /0.01 (USD coin) = 2.5 USD coins.
    const prisma = quotePrisma();
    const { svc } = make({ prisma });
    const out = await svc.quote(
      auth,
      { fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1', fromAmount: '1', fxRate: '0.00025' },
      'corr',
    );
    expect(out.toAmount).toBe('2.5');
    expect(out.status).toBe('QUOTED');
    expect(out.fxRate).toBe('0.00025');
  });

  it('same-currency swap (fxRate defaults "1") is pure unit-value rebasing', async () => {
    // FROM unitValue 100, TO unitValue 0.01, rate 1 → 1 coin = 100 units → /0.01 = 10000 TO coins.
    const prisma = quotePrisma();
    const { svc } = make({ prisma });
    const out = await svc.quote(auth, { fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1', fromAmount: '1' }, 'corr');
    expect(out.toAmount).toBe('10000');
  });

  it('applies spread and fee', async () => {
    const prisma = quotePrisma();
    const { svc } = make({ prisma });
    // 1 × 100 × 0.00025 × (1 − 0.2) / 0.01 = 2.0, then − fee 0.5 = 1.5.
    const out = await svc.quote(
      auth,
      { fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1', fromAmount: '1', fxRate: '0.00025', spread: '0.2', fee: '0.5' },
      'corr',
    );
    expect(out.toAmount).toBe('1.5');
  });

  it('rejects a non-positive result (fee exceeds gross)', async () => {
    const prisma = quotePrisma();
    const { svc } = make({ prisma });
    await expect(
      svc.quote(auth, { fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1', fromAmount: '1', fxRate: '0.00025', fee: '999' }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.created).toHaveLength(0);
  });

  it('refuses swapping a coin for itself', async () => {
    const { svc } = make({ prisma: quotePrisma() });
    await expect(
      svc.quote(auth, { fromAssetId: 'khr', toAssetId: 'khr', walletId: 'w1', fromAmount: '1' }, 'corr'),
    ).rejects.toThrow(/distinct/);
  });

  it('is gated by the exchange flag', async () => {
    const flags = { requireEnabled: jest.fn().mockRejectedValue(new ForbiddenException('off')) };
    const prisma = quotePrisma();
    const { svc } = make({ prisma, flags });
    await expect(
      svc.quote(auth, { fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1', fromAmount: '1' }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.created).toHaveLength(0);
  });
});

// A stateful stand-in for the stablecoin_exchanges row.
function statefulPrisma(initial: Record<string, unknown>, wallet: Record<string, unknown> | null = WALLET) {
  let rec: Record<string, unknown> = { ...initial };
  const createMint = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'mr1', ...data }));
  return {
    store: () => rec,
    createMint,
    stablecoinExchange: {
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
    asset: { findUnique: async ({ where }: { where: { id: string } }) => (where.id === 'khr' ? FROM : where.id === 'usd' ? TO : null) },
    wallet: { findUnique: async () => wallet },
    transaction: { create: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    stablecoinMintRequest: { create: createMint },
  };
}

const base = (over: Record<string, unknown> = {}) => ({
  id: 'ex1', tenantId: 't1', fromAssetId: 'khr', toAssetId: 'usd', walletId: 'w1',
  fromAmount: '10', toAmount: '2.5', correlationId: 'corr', ...over,
});

describe('ExchangeService saga — burn source then mint destination', () => {
  it('burns the source, then mints the destination, and records the mint for supply visibility', async () => {
    const prisma = statefulPrisma(base({ status: 'CONFIRMED' }));
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'SB' });
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'M' });
    const getTransaction = jest.fn().mockResolvedValue({ status: 'confirmed' });
    const mint = { assertMintAllowed: jest.fn().mockResolvedValue(undefined) };
    const { svc } = make({ prisma, chain: { burnAsset, issueAsset, getTransaction }, mint });

    await svc.advance('t1', 'ex1'); // CONFIRMED -> SOURCE_BURN_PENDING
    expect(prisma.store().status).toBe('SOURCE_BURN_PENDING');
    expect(burnAsset).toHaveBeenCalledWith(expect.objectContaining({ assetCode: 'KHRP', amount: '10' }));

    await svc.advance('t1', 'ex1'); // -> SOURCE_BURNED
    expect(prisma.store().status).toBe('SOURCE_BURNED');

    await svc.advance('t1', 'ex1'); // mint -> COMPLETED
    expect(prisma.store().status).toBe('COMPLETED');
    expect(mint.assertMintAllowed).toHaveBeenCalledWith(
      expect.objectContaining({ assetId: 'usd', amount: '2.5', resourceType: 'stablecoin_exchange' }),
    );
    expect(issueAsset).toHaveBeenCalledWith(expect.objectContaining({ assetCode: 'USDX', amount: '2.5' }));
    // The destination supply must be visible to getState — a CONFIRMED mint row, keyed to the swap.
    expect(prisma.createMint).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assetId: 'usd', amount: '2.5', status: 'CONFIRMED', fundingReference: 'exchange:ex1' }),
    }));
    expect(prisma.store().mintRequestId).toBe('mr1');
    expect(burnAsset).toHaveBeenCalledTimes(1); // never double-burned
  });

  it('compensates (re-issues the source coin) when the mint leg fails after the burn', async () => {
    const prisma = statefulPrisma(base({ status: 'SOURCE_BURNED' }));
    const issueAsset = jest
      .fn()
      .mockRejectedValueOnce(new Error('mint failed')) // destination mint fails
      .mockResolvedValueOnce({ transactionHash: 'REISSUE' }); // compensation re-issue
    const { svc } = make({ prisma, chain: { issueAsset, burnAsset: jest.fn(), getTransaction: jest.fn() } });

    await svc.advance('t1', 'ex1'); // mint fails -> COMPENSATING
    expect(prisma.store().status).toBe('COMPENSATING');
    await svc.advance('t1', 'ex1'); // re-issue source -> COMPENSATED
    expect(prisma.store().status).toBe('COMPENSATED');
    // The re-issue restores the SOURCE coin (KHRP) to the holder, not the destination.
    expect(issueAsset).toHaveBeenLastCalledWith(expect.objectContaining({ assetCode: 'KHRP', amount: '10' }));
  });

  it('REFUSES to mint when the destination reserve would breach (no tokens created), then compensates', async () => {
    const prisma = statefulPrisma(base({ status: 'SOURCE_BURNED' }));
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'M' });
    const mint = { assertMintAllowed: jest.fn().mockRejectedValue(new Error('would breach reserve target')) };
    const { svc } = make({ prisma, chain: { issueAsset, burnAsset: jest.fn(), getTransaction: jest.fn() }, mint });
    await svc.advance('t1', 'ex1');
    expect(issueAsset).not.toHaveBeenCalled(); // destination never minted beyond its reserve
    expect(prisma.store().status).toBe('COMPENSATING');
  });

  it('marks FAILED when the source burn fails on chain', async () => {
    const prisma = statefulPrisma(base({ status: 'SOURCE_BURN_PENDING', sourceBurnHash: 'SB' }));
    const getTransaction = jest.fn().mockResolvedValue({ status: 'failed' });
    const { svc } = make({ prisma, chain: { getTransaction, burnAsset: jest.fn(), issueAsset: jest.fn() } });
    const r = await svc.advance('t1', 'ex1');
    expect(r.status).toBe('FAILED');
  });

  it("REFUSES to burn from another tenant's wallet", async () => {
    const prisma = statefulPrisma(base({ status: 'CONFIRMED' }), { ...WALLET, tenantId: 'OTHER' });
    const { svc } = make({ prisma, chain: { burnAsset: jest.fn(), issueAsset: jest.fn(), getTransaction: jest.fn() } });
    await expect(svc.advance('t1', 'ex1')).rejects.toThrow(/Exchange wallet not found/);
  });
});

describe('ExchangeService.confirm', () => {
  it('rejects an expired quote', async () => {
    const prisma = statefulPrisma(base({ status: 'QUOTED', quoteExpiresAt: new Date(Date.now() - 60_000) }));
    const { svc } = make({ prisma });
    const r = await svc.confirm(auth, 'ex1');
    expect(r.status).toBe('FAILED');
    expect(r.failureReason).toContain('expired');
  });

  it('checks spendability of the source coins before committing', async () => {
    const prisma = statefulPrisma(base({ status: 'QUOTED', quoteExpiresAt: new Date(Date.now() + 60_000) }));
    const escrow = { assertSpendable: jest.fn().mockResolvedValue(undefined) };
    const { svc } = make({ prisma, escrow });
    const r = await svc.confirm(auth, 'ex1');
    expect(escrow.assertSpendable).toHaveBeenCalledWith(
      expect.objectContaining({ walletId: 'w1', assetId: 'khr', assetCode: 'KHRP', amount: '10' }),
    );
    expect(r.status).toBe('CONFIRMED');
  });

  it('refuses to confirm against escrowed/insufficient source balance', async () => {
    const prisma = statefulPrisma(base({ status: 'QUOTED', quoteExpiresAt: new Date(Date.now() + 60_000) }));
    const escrow = { assertSpendable: jest.fn().mockRejectedValue(new BadRequestException('escrowed')) };
    const { svc } = make({ prisma, escrow });
    await expect(svc.confirm(auth, 'ex1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.store().status).toBe('QUOTED'); // not committed
  });
});
