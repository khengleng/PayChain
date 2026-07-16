import { SymmetricCrypto } from '@paychain/security';
import { ExpiryService, type ExpiryLot } from './expiry.service';

describe('ExpiryService', () => {
  const crypto = new SymmetricCrypto('test-encryption-key-at-least-16');
  const secretEnc = crypto.encrypt('SXXXsecret');
  const now = new Date('2026-07-15T00:00:00.000Z');

  const lot: ExpiryLot = {
    id: 'lot1',
    tenantId: 't1',
    walletId: 'w1',
    assetId: 'a1',
    remaining: '100',
    asset: { assetCode: 'PTS', issuerPublicKey: 'GISSUER' },
  };

  let recordAudit: jest.Mock;
  beforeEach(() => {
    recordAudit = jest.fn().mockResolvedValue(undefined);
  });

  function build(balance: string, burnAsset: jest.Mock, updateMany: jest.Mock, txCreate: jest.Mock) {
    const prisma = {
      pointsLot: { findMany: jest.fn().mockResolvedValue([lot]), updateMany },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'w1', stellarAccountId: 'GHOLDER', stellarSecretEnc: secretEnc }),
      },
      transaction: { create: txCreate },
    } as never;
    const chain = {
      getBalance: jest.fn().mockResolvedValue([{ assetCode: 'PTS', issuerPublicKey: 'GISSUER', balance }]),
      burnAsset,
    } as never;
    return new ExpiryService(prisma, chain, crypto, recordAudit);
  }

  it('claims the lot (ACTIVE→EXPIRED) then burns the held remaining', async () => {
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const claim = jest.fn().mockResolvedValue({ count: 1 }); // won the claim
    const txCreate = jest.fn().mockResolvedValue({});
    const res = await build('100', burnAsset, claim, txCreate).processExpired(now);
    expect(res).toEqual({ scanned: 1, expired: 1, burned: 1 });
    expect(burnAsset).toHaveBeenCalledWith(expect.objectContaining({ amount: '100' }));
    expect(claim).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
        data: expect.objectContaining({ status: 'EXPIRED', remaining: '0' }),
      }),
    );
  });

  it('never over-burns: burns only what the wallet still holds', async () => {
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const res = await build('30', burnAsset, jest.fn().mockResolvedValue({ count: 1 }), jest.fn().mockResolvedValue({})).processExpired(now);
    expect(burnAsset).toHaveBeenCalledWith(expect.objectContaining({ amount: '30' }));
    expect(res.burned).toBe(1);
  });

  it('marks the lot EXPIRED without burning when nothing is held', async () => {
    const burnAsset = jest.fn();
    const res = await build('0', burnAsset, jest.fn().mockResolvedValue({ count: 1 }), jest.fn()).processExpired(now);
    expect(burnAsset).not.toHaveBeenCalled();
    expect(res).toEqual({ scanned: 1, expired: 1, burned: 0 });
  });

  it('skips a lot another run already claimed (no double-burn)', async () => {
    const burnAsset = jest.fn();
    const res = await build('100', burnAsset, jest.fn().mockResolvedValue({ count: 0 }), jest.fn()).processExpired(now);
    expect(burnAsset).not.toHaveBeenCalled();
    expect(res).toEqual({ scanned: 1, expired: 0, burned: 0 });
  });
});
