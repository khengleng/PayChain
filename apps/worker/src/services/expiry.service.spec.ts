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

  function build(balance: string, burnAsset: jest.Mock, update: jest.Mock, txCreate: jest.Mock) {
    const prisma = {
      pointsLot: { findMany: jest.fn().mockResolvedValue([lot]), update },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'w1', stellarAccountId: 'GHOLDER', stellarSecretEnc: secretEnc }),
      },
      transaction: { create: txCreate },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    } as never;
    const chain = {
      getBalance: jest.fn().mockResolvedValue([{ assetCode: 'PTS', issuerPublicKey: 'GISSUER', balance }]),
      burnAsset,
    } as never;
    return new ExpiryService(prisma, chain, crypto);
  }

  it('burns the held remaining and marks the lot EXPIRED', async () => {
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const update = jest.fn().mockResolvedValue({});
    const txCreate = jest.fn().mockResolvedValue({});
    const res = await build('100', burnAsset, update, txCreate).processExpired(now);
    expect(res).toEqual({ scanned: 1, expired: 1, burned: 1 });
    expect(burnAsset).toHaveBeenCalledWith(expect.objectContaining({ amount: '100' }));
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'EXPIRED', remaining: '0' }) }),
    );
  });

  it('never over-burns: burns only what the wallet still holds', async () => {
    const burnAsset = jest.fn().mockResolvedValue({ transactionHash: 'H', submitted: true });
    const res = await build('30', burnAsset, jest.fn().mockResolvedValue({}), jest.fn().mockResolvedValue({})).processExpired(now);
    expect(burnAsset).toHaveBeenCalledWith(expect.objectContaining({ amount: '30' }));
    expect(res.burned).toBe(1);
  });

  it('marks the lot EXPIRED without burning when nothing is held', async () => {
    const burnAsset = jest.fn();
    const res = await build('0', burnAsset, jest.fn().mockResolvedValue({}), jest.fn()).processExpired(now);
    expect(burnAsset).not.toHaveBeenCalled();
    expect(res).toEqual({ scanned: 1, expired: 1, burned: 0 });
  });
});
