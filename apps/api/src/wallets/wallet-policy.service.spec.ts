import { ForbiddenException } from '@nestjs/common';
import { WalletPolicyService } from './wallet-policy.service';

const BASE = {
  id: 'p1', tenantId: 't1', walletId: 'w1', assetId: 'a1',
  maxBalance: null, maxDailyReceive: null, maxDailySend: null, maxMonthlyVolume: null,
  maxTxPerDay: null, allowedCountries: [], kycLevel: 'BASIC', riskRating: 'LOW',
  sanctionsStatus: 'CLEAR', eddRequired: false, transferRestricted: false,
  frozen: false, redemptionEligible: true,
};

function build(policies: Record<string, unknown>[], opts: { held?: string; mints?: string[]; redemptions?: string[] } = {}) {
  const mintWhere: Record<string, any>[] = [];
  const prisma = {
    walletStablecoinPolicy: { findMany: async () => policies },
    asset: { findUnique: async () => ({ assetCode: 'DKHR', issuerPublicKey: 'GI' }) },
    balanceReadModel: { findFirst: async () => (opts.held ? { balance: opts.held } : null) },
    stablecoinMintRequest: {
      findMany: async ({ where }: { where: Record<string, any> }) => {
        mintWhere.push(where);
        return (opts.mints ?? []).map((amount) => ({ amount }));
      },
    },
    stablecoinRedemption: { findMany: async () => (opts.redemptions ?? []).map((amount) => ({ amount })) },
  } as never;
  return Object.assign(new WalletPolicyService(prisma), { __mintWhere: mintWhere });
}

const receive = (amount = '100') =>
  ({ tenantId: 't1', walletId: 'w1', assetId: 'a1', operation: 'RECEIVE' as const, amount });

describe('§27 — the invariant: loyalty wallets are not stablecoin-enabled by default', () => {
  it('REFUSES when no policy exists — the whole point of §27', async () => {
    // Before this guard, no policy row was indistinguishable from an unrestricted one, so every
    // loyalty wallet on the platform was stablecoin-enabled.
    const svc = build([]);
    await expect(svc.assertAllowed(receive())).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.assertAllowed(receive())).rejects.toThrow(/not stablecoin-enabled/);
  });

  it('ALLOWS once an operator has deliberately granted a policy', async () => {
    const svc = build([BASE]);
    await expect(svc.assertAllowed(receive())).resolves.toBeUndefined();
  });

  it("REFUSES a policy belonging to another tenant", async () => {
    const svc = build([{ ...BASE, tenantId: 'OTHER' }]);
    await expect(svc.assertAllowed(receive())).rejects.toThrow(/not stablecoin-enabled for this tenant/);
  });

  it('prefers an asset-specific policy over the wallet-wide ALL row', async () => {
    // A narrower grant must win: enabling one stablecoin must not enable every future one.
    const svc = build([
      { ...BASE, assetId: 'ALL', frozen: false },
      { ...BASE, assetId: 'a1', frozen: true },
    ]);
    await expect(svc.assertAllowed(receive())).rejects.toThrow(/frozen/i);
  });

  it('falls back to the ALL row when no asset-specific policy exists', async () => {
    const svc = build([{ ...BASE, assetId: 'ALL' }]);
    await expect(svc.assertAllowed(receive())).resolves.toBeUndefined();
  });
});

describe('§27 — the thirteen controls', () => {
  it('REFUSES a frozen wallet', async () => {
    await expect(build([{ ...BASE, frozen: true }]).assertAllowed(receive())).rejects.toThrow(/frozen/i);
  });

  it('REFUSES a wallet with a non-clear sanctions status', async () => {
    await expect(build([{ ...BASE, sanctionsStatus: 'MATCH' }]).assertAllowed(receive())).rejects.toThrow(/sanctions/i);
  });

  it('REFUSES while enhanced due diligence is outstanding', async () => {
    // EDD is a stop, not a warning: it happens before further activity, not alongside it.
    await expect(build([{ ...BASE, eddRequired: true }]).assertAllowed(receive())).rejects.toThrow(/due diligence/i);
  });

  it('REFUSES a wallet with no KYC level recorded', async () => {
    await expect(build([{ ...BASE, kycLevel: 'NONE' }]).assertAllowed(receive())).rejects.toThrow(/KYC/i);
  });

  it('REFUSES a send from a transfer-restricted wallet, but still allows receive', async () => {
    const svc = build([{ ...BASE, transferRestricted: true }]);
    await expect(svc.assertAllowed({ ...receive(), operation: 'SEND' })).rejects.toThrow(/restricted from sending/);
    await expect(svc.assertAllowed(receive())).resolves.toBeUndefined();
  });

  it('REFUSES redemption unless explicitly eligible', async () => {
    const svc = build([{ ...BASE, redemptionEligible: false }]);
    await expect(svc.assertAllowed({ ...receive(), operation: 'REDEEM' })).rejects.toThrow(/not eligible for redemption/);
  });

  it('enforces maxBalance against the projected holding, not the current one', async () => {
    const svc = build([{ ...BASE, maxBalance: '1000' }], { held: '950' });
    await expect(svc.assertAllowed(receive('100'))).rejects.toThrow(/above its cap/);
    await expect(svc.assertAllowed(receive('50'))).resolves.toBeUndefined(); // exactly at the cap
  });

  it('enforces maxDailyReceive cumulatively — one big receipt cannot be split into many', async () => {
    const svc = build([{ ...BASE, maxDailyReceive: '500' }], { mints: ['200', '250'] });
    await expect(svc.assertAllowed(receive('100'))).rejects.toThrow(/daily receive limit/);
    await expect(svc.assertAllowed(receive('50'))).resolves.toBeUndefined();
  });

  it('enforces maxDailySend cumulatively on redemption', async () => {
    const svc = build([{ ...BASE, maxDailySend: '100' }], { redemptions: ['80'] });
    await expect(
      svc.assertAllowed({ ...receive('30'), operation: 'REDEEM' }),
    ).rejects.toThrow(/daily send limit/);
  });

  // Found by demoing it on the sandbox: two mints REFUSED at the reserve gate had consumed a
  // 10,000 daily allowance, because the query counted every request regardless of outcome. A
  // customer whose mint failed would be locked out for the rest of the day.
  it('counts only mints whose tokens exist or are in flight — a refused mint must not consume the allowance', async () => {
    const svc = build([{ ...BASE, maxDailyReceive: '10000' }]);
    await svc.assertAllowed(receive('100')).catch(() => undefined);
    const where = (svc as unknown as { __mintWhere: Record<string, any>[] }).__mintWhere[0]!;
    // Positive filter on landed/in-flight states, NOT "everything except failed".
    expect(where.status).toEqual({ in: ['SIGNING', 'SUBMITTED', 'CONFIRMED', 'RECONCILED'] });
    expect(where.status.in).not.toContain('APPROVAL_REQUIRED'); // approved != received
    expect(where.status.in).not.toContain('REJECTED');
  });

  it('uses fixed-point comparison at the limit boundary', async () => {
    const svc = build([{ ...BASE, maxBalance: '1000' }], { held: '999.9999999' });
    await expect(svc.assertAllowed(receive('0.0000001'))).resolves.toBeUndefined(); // exactly 1000
    await expect(svc.assertAllowed(receive('0.0000002'))).rejects.toThrow(/above its cap/);
  });
});
