import { BadRequestException } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import type { AdminContext } from '../admin-auth/admin-context';
import { AdminPartnerService } from './admin-partner.service';
import { LOYALTY_INTEGRATION_SCOPES, TRUSTEE_INTEGRATION_SCOPES } from '../admin-clients/api-scopes';

const cfg = { PARTNER_PORTAL_URL: 'https://dev.example' } as unknown as PayChainConfig;
const admin = { userId: 'a1', email: 'op@paychain', role: 'SUPER_ADMIN', permissions: [], attributes: {} } as AdminContext;

function build(application: Record<string, unknown> | null) {
  const prisma = {
    partnerApplication: {
      findUnique: jest.fn().mockResolvedValue(application),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'app1', status: data.status })),
    },
    partnerUser: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  } as never;
  const audit = { record: jest.fn().mockResolvedValue(undefined) } as never;
  const mailer = { send: jest.fn().mockResolvedValue(undefined) } as never;
  const tenants = { create: jest.fn().mockResolvedValue({ id: 'tenant1' }) } as never;
  const clients = { issue: jest.fn().mockResolvedValue({ id: 'client1', clientId: 'pc_new', clientSecret: 's', warning: 'w' }) } as never;
  const svc = new AdminPartnerService(prisma, audit, mailer, tenants, clients, cfg);
  const typedPrisma = prisma as unknown as {
    partnerApplication: Record<string, jest.Mock>;
    partnerUser: Record<string, jest.Mock>;
  };
  return { svc, prisma: typedPrisma, tenants, clients, mailer };
}

const base = { id: 'app1', orgName: 'Acme', contactEmail: 'ada@acme.com', status: 'PENDING', requestedParentTenantId: null };

describe('AdminPartnerService.approve', () => {
  it('LOYALTY → DIRECT tenant + loyalty scopes, provisions and links', async () => {
    const { svc, prisma, tenants, clients, mailer } = build({ ...base, integrationType: 'LOYALTY' });
    const out = await svc.approve(admin, 'app1', 'c1');
    expect((tenants as never as { create: jest.Mock }).create).toHaveBeenCalledWith(
      admin, expect.objectContaining({ name: 'Acme', type: 'DIRECT' }), 'c1',
    );
    expect((clients as never as { issue: jest.Mock }).issue).toHaveBeenCalledWith(
      admin, 'tenant1', expect.objectContaining({ scopes: LOYALTY_INTEGRATION_SCOPES }), 'c1',
    );
    expect(prisma.partnerApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PROVISIONED', tenantId: 'tenant1', apiClientId: 'client1' }) }),
    );
    expect(prisma.partnerUser.updateMany).toHaveBeenCalled();
    expect((mailer as never as { send: jest.Mock }).send).toHaveBeenCalled();
    expect(out.status).toBe('PROVISIONED');
  });

  it('TRUSTEE → read-only trustee scopes', async () => {
    const { svc, clients } = build({ ...base, integrationType: 'TRUSTEE' });
    await svc.approve(admin, 'app1', 'c1');
    expect((clients as never as { issue: jest.Mock }).issue).toHaveBeenCalledWith(
      admin, 'tenant1', expect.objectContaining({ scopes: TRUSTEE_INTEGRATION_SCOPES }), 'c1',
    );
  });

  it('WHOLESALER → WHOLESALER tenant type', async () => {
    const { svc, tenants } = build({ ...base, integrationType: 'WHOLESALER' });
    await svc.approve(admin, 'app1', 'c1');
    expect((tenants as never as { create: jest.Mock }).create).toHaveBeenCalledWith(
      admin, expect.objectContaining({ type: 'WHOLESALER' }), 'c1',
    );
  });

  it('RETAILER without a parent tenant is refused (no provisioning)', async () => {
    const { svc, tenants } = build({ ...base, integrationType: 'RETAILER', requestedParentTenantId: null });
    await expect(svc.approve(admin, 'app1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
    expect((tenants as never as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });

  it('refuses to approve a non-pending application', async () => {
    const { svc } = build({ ...base, integrationType: 'LOYALTY', status: 'PROVISIONED' });
    await expect(svc.approve(admin, 'app1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
