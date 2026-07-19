import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { hashPassword } from '@paychain/security';
import type { PayChainConfig } from '@paychain/config';
import { PartnerService } from './partner.service';

const cfg = { PARTNER_PORTAL_URL: 'https://dev.example' } as unknown as PayChainConfig;

function build(over: {
  partnerUser?: Partial<Record<string, jest.Mock>>;
  partnerApplication?: Partial<Record<string, jest.Mock>>;
  apiClient?: Partial<Record<string, jest.Mock>>;
} = {}) {
  const prisma = {
    partnerUser: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({}), ...over.partnerUser },
    partnerApplication: { create: jest.fn().mockResolvedValue({ id: 'app1', reference: 'pa_x' }), findUnique: jest.fn(), ...over.partnerApplication },
    apiClient: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}), ...over.apiClient },
  } as never;
  const jwt = { signAsync: jest.fn().mockResolvedValue('jwt.token') } as never;
  const audit = { record: jest.fn().mockResolvedValue(undefined) } as never;
  const mailer = { send: jest.fn().mockResolvedValue(undefined) } as never;
  const svc = new PartnerService(prisma, jwt, audit, mailer, cfg);
  const typedPrisma = prisma as unknown as {
    partnerUser: Record<string, jest.Mock>;
    partnerApplication: Record<string, jest.Mock>;
    apiClient: Record<string, jest.Mock>;
  };
  return { svc, prisma: typedPrisma, jwt, audit, mailer };
}

const registerDto = {
  orgName: 'Acme',
  contactName: 'Ada',
  contactEmail: 'Ada@Acme.com',
  password: 'longenoughpw',
  integrationType: 'LOYALTY' as const,
  useCase: 'we want points',
};

describe('PartnerService.register', () => {
  it('creates a PENDING application + user, lowercases email, emails a confirmation', async () => {
    const { svc, prisma, mailer } = build();
    const out = await svc.register({ ...registerDto }, 'c1');
    expect(out.reference).toMatch(/^pa_/);
    expect(prisma.partnerApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ contactEmail: 'ada@acme.com', status: 'PENDING' }) }),
    );
    expect(prisma.partnerUser.create).toHaveBeenCalled();
    expect((mailer as never as { send: jest.Mock }).send).toHaveBeenCalled();
  });

  it('rejects a duplicate email with 409', async () => {
    const { svc } = build({ partnerUser: { findUnique: jest.fn().mockResolvedValue({ id: 'u1' }) } });
    await expect(svc.register({ ...registerDto }, 'c1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a parent tenant for a RETAILER application', async () => {
    const { svc } = build();
    await expect(
      svc.register({ ...registerDto, integrationType: 'RETAILER' }, 'c1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('honeypot: a filled website field creates nothing but returns success', async () => {
    const { svc, prisma } = build();
    const out = await svc.register({ ...registerDto, website: 'bot' } as never, 'c1');
    expect(out.reference).toMatch(/^pa_/);
    expect(prisma.partnerApplication.create).not.toHaveBeenCalled();
  });
});

describe('PartnerService.login', () => {
  it('issues a partner JWT on correct credentials', async () => {
    const user = { id: 'u1', email: 'ada@acme.com', status: 'ACTIVE', passwordHash: hashPassword('longenoughpw') };
    const { svc, jwt } = build({ partnerUser: { findUnique: jest.fn().mockResolvedValue(user) } });
    const out = await svc.login({ email: 'ada@acme.com', password: 'longenoughpw' });
    expect(out.access_token).toBe('jwt.token');
    expect((jwt as never as { signAsync: jest.Mock }).signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ typ: 'partner', sub: 'u1' }),
      expect.anything(),
    );
  });

  it('rejects a wrong password with 401', async () => {
    const user = { id: 'u1', email: 'ada@acme.com', status: 'ACTIVE', passwordHash: hashPassword('longenoughpw') };
    const { svc } = build({ partnerUser: { findUnique: jest.fn().mockResolvedValue(user) } });
    await expect(svc.login({ email: 'ada@acme.com', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('PartnerService.rotateCredentials', () => {
  const partner = { userId: 'u1', email: 'ada@acme.com', applicationId: 'app1', tenantId: 't1' };

  it('refuses when the application is not provisioned', async () => {
    const { svc } = build({ partnerApplication: { findUnique: jest.fn().mockResolvedValue({ status: 'PENDING' }) } });
    await expect(svc.rotateCredentials(partner, 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rotates the client secret and returns it once when provisioned', async () => {
    const { svc, prisma } = build({
      partnerApplication: { findUnique: jest.fn().mockResolvedValue({ status: 'PROVISIONED', apiClientId: 'cli1' }) },
      apiClient: { findUnique: jest.fn().mockResolvedValue({ id: 'cli1', clientId: 'pc_abc', tenantId: 't1' }), update: jest.fn().mockResolvedValue({}) },
    });
    const out = await svc.rotateCredentials(partner, 'c1');
    expect(out.clientId).toBe('pc_abc');
    expect(out.clientSecret).toBeTruthy();
    expect(prisma.apiClient.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'cli1' }, data: expect.objectContaining({ tokenVersion: { increment: 1 } }) }),
    );
  });
});
