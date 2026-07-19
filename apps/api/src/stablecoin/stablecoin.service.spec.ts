import { ForbiddenException } from '@nestjs/common';
import { StablecoinService } from './stablecoin.service';
import type { AuthContext } from '../auth/auth-context';

const auth: AuthContext = { tenantId: 't1', clientId: 'paykh', scopes: [] };

function build(flagOn = true) {
  const assetCreate = jest.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      assetCode: data.assetCode,
      stablecoinConfig: {
        id: 'cfg1',
        assetId: 'asset1',
        ...data.stablecoinConfig.create,
        activationStatus: 'INACTIVE',
        createdAt: new Date(),
      },
    }),
  );
  const prisma = { asset: { create: assetCreate } } as never;
  const crypto = { encrypt: (s: string) => `enc(${s})` } as never;
  const audit = { record: jest.fn().mockResolvedValue(undefined) } as never;
  const flags = {
    requireEnabled: jest.fn().mockImplementation(async () => {
      if (!flagOn) throw new ForbiddenException('flag off');
    }),
  } as never;
  const chain = { createWallet: jest.fn().mockResolvedValue({ publicKey: 'GISS', secretKey: 'SEC' }) } as never;
  const svc = new StablecoinService(prisma, crypto, audit, flags, chain);
  return { svc, assetCreate, audit };
}

const dto = {
  assetCode: 'MPTS',
  assetName: 'Merchant Points',
  referenceCurrency: 'KHR' as const,
  unitValue: '100',
  brandLabel: 'points',
  merchantReference: 'merchant-42',
};

describe('StablecoinService.provisionMerchantCoin', () => {
  it('creates a DRAFT branded coin with the unit value + merchant reference, mints nothing', async () => {
    const { svc, assetCreate } = build();
    const out = await svc.provisionMerchantCoin(auth, dto, 'corr');

    expect(assetCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assetCode: 'MPTS',
          status: 'DRAFT',
          transferability: false,
          redeemability: false,
          stablecoinConfig: expect.objectContaining({
            create: expect.objectContaining({
              referenceCurrency: 'KHR',
              unitValue: '100',
              brandLabel: 'points',
              merchantReference: 'merchant-42',
              lifecycleState: 'DRAFT',
              classification: 'FIAT_BACKED_STABLECOIN',
            }),
          }),
        }),
      }),
    );
    expect(out.lifecycleState).toBe('DRAFT');
    expect(out.unitValue).toBe('100');
    expect(out.brandLabel).toBe('points');
  });

  it('is gated by the creation flags (refuses when disabled)', async () => {
    const { svc, assetCreate } = build(false);
    await expect(svc.provisionMerchantCoin(auth, dto, 'corr')).rejects.toBeInstanceOf(ForbiddenException);
    expect(assetCreate).not.toHaveBeenCalled();
  });
});
