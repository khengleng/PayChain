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
    },
    asset: { findUnique: async () => ({ ...ASSET }) },
    wallet: { findUnique: async () => ({ id: 'w1', stellarAccountId: 'GDEST' }) },
  };
}

const deps = (prisma: unknown, chain: unknown, funding: unknown, compliance?: unknown) =>
  new MintService(
    prisma as never,
    { decrypt: () => 'ISSUER_SECRET' } as never,
    { record: jest.fn() } as never,
    { requireEnabled: jest.fn() } as never,
    (compliance ?? { screenTransaction: jest.fn().mockResolvedValue({ decision: 'CLEAR' }) }) as never,
    funding as never,
    chain as never,
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
