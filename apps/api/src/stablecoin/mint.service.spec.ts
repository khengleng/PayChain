import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MintService } from './mint.service';

const ASSET = {
  id: 'a1',
  tenantId: 't1',
  assetCode: 'USDX',
  issuerPublicKey: 'GISSUER',
  issuerSecretEnc: 'enc',
  stablecoinConfig: { lifecycleState: 'ACTIVE', dailyMintLimit: null },
};

/** Minimal stateful Prisma double so advance() can be re-run like the real saga. */
function statefulPrisma(initial: Record<string, unknown>) {
  let rec: Record<string, unknown> = { ...initial };
  return {
    store: () => rec,
    stablecoinMintRequest: {
      findUnique: async () => ({ ...rec }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        rec = { ...rec, ...data };
        return { ...rec };
      },
      findMany: async () => [],
      updateMany: async ({ where, data }: { where: { status: string }; data: { status: string } }) => {
        if (rec.status === where.status) {
          rec = { ...rec, ...data };
          return { count: 1 };
        }
        return { count: 0 };
      },
    },
    asset: { findUnique: async () => ({ ...ASSET }) },
    // tenantId and status are required: the destination is now tenant-scoped and
    // status-checked, so a wallet without them is not a realistic row.
    wallet: {
      findUnique: async () => ({ id: 'w1', tenantId: 't1', status: 'ACTIVE', stellarAccountId: 'GDEST' }),
    },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    trusteeMintAuthorization: {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

const deps = (
  prisma: unknown,
  chain: unknown,
  funding: unknown,
  compliance?: unknown,
  reserve?: unknown,
  walletPolicy?: unknown,
  flags?: unknown,
) =>
  new MintService(
    prisma as never,
    { decrypt: () => 'ISSUER_SECRET' } as never,
    { record: jest.fn() } as never,
    // Trustee-authorization flag OFF by default so these tests exercise the saga, not the §24 gate
    // (which has its own tests). requireEnabled is a no-op (minting enablement is asserted at request).
    (flags ?? { requireEnabled: jest.fn(), isEnabled: jest.fn().mockResolvedValue(false) }) as never,
    (compliance ?? { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) }) as never,
    funding as never,
    chain as never,
    // Default: reserve comfortably covers supply, so these tests exercise the saga rather than
    // the reserve guard. The guard has its own tests below.
    (reserve ?? {
      assertFresh: jest.fn().mockResolvedValue(undefined),
      wouldBreachTarget: jest.fn().mockResolvedValue({
        breach: false,
        projectedRatio: '1.500000',
        targetRatio: '1.0',
        reserveBalance: '150',
        projectedSupply: '100',
      }),
    }) as never,
    // Permissive by default so these tests exercise the saga, not §27. The policy has its own
    // tests, and the sagas have dedicated §27 tests below.
    (walletPolicy ?? { assertAllowed: jest.fn().mockResolvedValue(undefined) }) as never,
  );

describe('MintService saga', () => {
  it('never advances toward minting until reserve/funding is confirmed (§22)', async () => {
    const prisma = statefulPrisma({ id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'REQUESTED', fundingReference: 'BAD-REF', reserveConfirmed: false });
    const issueAsset = jest.fn();
    const svc = deps(prisma, { issueAsset }, { confirmFunding: async () => ({ confirmed: false }) });

    const after = await svc.advance('t1', 'm1');
    expect(after.status).toBe('RESERVE_PENDING');
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('refuses to mint if reserve is not confirmed, even from APPROVED (hard guard)', async () => {
    const prisma = statefulPrisma({ id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: false });
    const issueAsset = jest.fn();
    const svc = deps(prisma, { issueAsset }, { confirmFunding: jest.fn() });
    await expect(svc.advance('t1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  // §23: reserveConfirmed only proves *this* request's funding landed. It says nothing about
  // whether the total reserve still covers total supply — so the ratio is re-checked at the
  // last moment before broadcast.
  it('refuses to mint when it would breach the reserve target, even with funding confirmed', async () => {
    const prisma = statefulPrisma({ id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true });
    const issueAsset = jest.fn();
    const wouldBreachTarget = jest.fn().mockResolvedValue({
      breach: true,
      projectedRatio: '0.500000',
      targetRatio: '1.0',
      reserveBalance: '50',
      projectedSupply: '100',
    });
    const svc = deps(prisma, { issueAsset }, { confirmFunding: jest.fn() }, undefined, {
      assertFresh: jest.fn().mockResolvedValue(undefined),
      wouldBreachTarget,
    });

    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/breach reserve target/i);
    expect(issueAsset).not.toHaveBeenCalled();
    expect(wouldBreachTarget).toHaveBeenCalledWith('t1', 'a1', '100');
  });

  it('mints when the reserve covers the projected supply', async () => {
    const prisma = statefulPrisma({ id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true });
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const svc = deps(prisma, { issueAsset, getTransaction: jest.fn() }, { confirmFunding: jest.fn() });
    await svc.advance('t1', 'm1');
    expect(issueAsset).toHaveBeenCalled();
  });

  it('does not re-mint after a post-submission timeout (idempotent recovery §0.5)', async () => {
    const prisma = statefulPrisma({ id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true, blockchainHash: null });
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const getTransaction = jest
      .fn()
      .mockRejectedValueOnce(new Error('network timeout')) // confirmation check times out
      .mockResolvedValueOnce({ status: 'confirmed' }); // later succeeds
    const svc = deps(prisma, { issueAsset, getTransaction }, { confirmFunding: jest.fn() });

    // APPROVED → SUBMITTED (mint broadcast once)
    let r = await svc.advance('t1', 'm1');
    expect(r.status).toBe('SUBMITTED');
    expect(r.blockchainHash).toBe('H');

    // SUBMITTED → confirmation check throws (timeout). State must remain SUBMITTED, no re-mint.
    await expect(svc.advance('t1', 'm1')).rejects.toThrow('network timeout');
    expect(prisma.store().status).toBe('SUBMITTED');

    // Retry → confirmed.
    r = await svc.advance('t1', 'm1');
    expect(r.status).toBe('CONFIRMED');

    expect(issueAsset).toHaveBeenCalledTimes(1); // never double-minted
  });

  it('enforces maker-checker on approval (§22/§19)', async () => {
    const base = { id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVAL_REQUIRED', requestedBy: 'maker' };
    const makerSvc = deps(statefulPrisma(base), {}, {});
    await expect(makerSvc.approve({ tenantId: 't1', clientId: 'maker', scopes: [] }, 'm1')).rejects.toBeInstanceOf(ForbiddenException);

    const checkerSvc = deps(statefulPrisma(base), {}, {});
    const approved = await checkerSvc.approve({ tenantId: 't1', clientId: 'checker', scopes: [] }, 'm1');
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedBy).toBe('checker');
  });
});

/**
 * §7 tenant isolation on the mint path. The destination wallet was loaded by raw id with no
 * tenant scope, while loadActive() scoped the asset on the adjacent line — so the one path that
 * CREATES stablecoin value could deliver it into another tenant's wallet.
 */
describe('MintService — the destination wallet is tenant-scoped (§7)', () => {
  function build(wallet: Record<string, unknown> | null) {
    const prisma = statefulPrisma({
      id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true,
    }) as Record<string, any>;
    prisma.wallet = { findUnique: async () => wallet };
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    return { svc: deps(prisma, { issueAsset, getTransaction: jest.fn() }, { confirmFunding: jest.fn() }), issueAsset };
  }

  it("REFUSES to mint into another tenant's wallet", async () => {
    const { svc, issueAsset } = build({ id: 'w1', tenantId: 'OTHER', status: 'ACTIVE', stellarAccountId: 'GDEST' });
    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/Destination wallet not found/);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('REFUSES to mint into a FROZEN wallet', async () => {
    const { svc, issueAsset } = build({ id: 'w1', tenantId: 't1', status: 'FROZEN', stellarAccountId: 'GDEST' });
    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/FROZEN/);
    expect(issueAsset).not.toHaveBeenCalled();
  });
});

/**
 * §23 must be enforced BY the mint path, not merely available next to it. The whole category of
 * bug this audit found is guards that exist and are never called.
 */
describe('MintService — refuses to mint on stale reserve data (§23)', () => {
  it('propagates the freshness refusal and issues nothing', async () => {
    const prisma = statefulPrisma({
      id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true,
    });
    const issueAsset = jest.fn();
    const reserve = {
      assertFresh: jest.fn().mockRejectedValue(new BadRequestException('reserve data is stale')),
      wouldBreachTarget: jest.fn(),
    };
    const svc = deps(prisma, { issueAsset }, { confirmFunding: jest.fn() }, undefined, reserve);

    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/stale/i);
    expect(issueAsset).not.toHaveBeenCalled();
    // Checked BEFORE the ratio: an unverified number makes the ratio meaningless, not just wrong.
    expect(reserve.wouldBreachTarget).not.toHaveBeenCalled();
  });
});

describe('MintService — trustee authorization gate (§24)', () => {
  const APPROVED = { id: 'm1', tenantId: 't1', assetId: 'a1', amount: '100', status: 'APPROVED', reserveConfirmed: true, destinationWalletId: 'w1' };
  const flagOn = () => ({ requireEnabled: jest.fn(), isEnabled: jest.fn().mockResolvedValue(true) });

  it('flag OFF: mints without any trustee authorization (unchanged behavior)', async () => {
    const prisma = statefulPrisma({ ...APPROVED });
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'H' });
    const svc = deps(prisma, { issueAsset, getTransaction: jest.fn() }, { confirmFunding: jest.fn() });
    await svc.advance('t1', 'm1');
    expect(issueAsset).toHaveBeenCalled();
    expect(prisma.trusteeMintAuthorization.findFirst).not.toHaveBeenCalled();
  });

  it('flag ON + no authorization: refuses to mint', async () => {
    const prisma = statefulPrisma({ ...APPROVED });
    prisma.trusteeMintAuthorization.findFirst = jest.fn().mockResolvedValue(null);
    const issueAsset = jest.fn();
    const svc = deps(prisma, { issueAsset }, { confirmFunding: jest.fn() }, undefined, undefined, undefined, flagOn());
    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/no valid trustee authorization/i);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('flag ON + expired authorization: refuses to mint', async () => {
    const prisma = statefulPrisma({ ...APPROVED });
    prisma.trusteeMintAuthorization.findFirst = jest.fn().mockResolvedValue({ id: 'auth1', expiresAt: new Date(Date.now() - 1000) });
    const issueAsset = jest.fn();
    const svc = deps(prisma, { issueAsset }, { confirmFunding: jest.fn() }, undefined, undefined, undefined, flagOn());
    await expect(svc.advance('t1', 'm1')).rejects.toThrow(/no valid trustee authorization/i);
    expect(issueAsset).not.toHaveBeenCalled();
  });

  it('flag ON + valid authorization: mints and consumes it (single use)', async () => {
    const prisma = statefulPrisma({ ...APPROVED });
    prisma.trusteeMintAuthorization.findFirst = jest.fn().mockResolvedValue({ id: 'auth1', expiresAt: null });
    const consume = jest.fn().mockResolvedValue({});
    prisma.trusteeMintAuthorization.update = consume;
    const issueAsset = jest.fn().mockResolvedValue({ transactionHash: 'H' });
    const svc = deps(prisma, { issueAsset, getTransaction: jest.fn() }, { confirmFunding: jest.fn() }, undefined, undefined, undefined, flagOn());
    await svc.advance('t1', 'm1');
    expect(issueAsset).toHaveBeenCalled();
    expect(consume).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'auth1' }, data: expect.objectContaining({ status: 'CONSUMED', consumedByMintRequestId: 'm1' }) }),
    );
  });
});
