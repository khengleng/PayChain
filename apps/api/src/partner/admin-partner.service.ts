import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
import type { AdminContext } from '../admin-auth/admin-context';
import { AdminTenantsService } from '../admin-tenants/admin-tenants.service';
import { AdminClientsService } from '../admin-clients/admin-clients.service';
import {
  LOYALTY_INTEGRATION_SCOPES,
  TRUSTEE_INTEGRATION_SCOPES,
} from '../admin-clients/api-scopes';

type TenantType = 'DIRECT' | 'WHOLESALER' | 'RETAILER';

/** integrationType → the tenant type + scope preset that provisioning grants. */
function provisioningFor(integrationType: string): { type: TenantType; scopes: string[] } {
  switch (integrationType) {
    case 'TRUSTEE':
      return { type: 'DIRECT', scopes: TRUSTEE_INTEGRATION_SCOPES };
    case 'WHOLESALER':
      return { type: 'WHOLESALER', scopes: LOYALTY_INTEGRATION_SCOPES };
    case 'RETAILER':
      return { type: 'RETAILER', scopes: LOYALTY_INTEGRATION_SCOPES };
    case 'LOYALTY':
    default:
      return { type: 'DIRECT', scopes: LOYALTY_INTEGRATION_SCOPES };
  }
}

@Injectable()
export class AdminPartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mailer: MailerService,
    private readonly tenants: AdminTenantsService,
    private readonly clients: AdminClientsService,
    @Inject(CONFIG) private readonly config: PayChainConfig,
  ) {}

  async list() {
    const rows = await this.prisma.partnerApplication.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        orgName: r.orgName,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        integrationType: r.integrationType,
        status: r.status,
        reference: r.reference,
        tenantId: r.tenantId,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
    };
  }

  /** Approve → provision a tenant + API client (reusing the admin services) and link them. */
  async approve(admin: AdminContext, id: string, correlationId: string) {
    const application = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!application) throw new BadRequestException('Application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException(`Application is not pending (status=${application.status})`);
    }

    const plan = provisioningFor(application.integrationType);
    if (plan.type === 'RETAILER' && !application.requestedParentTenantId) {
      throw new BadRequestException('Retailer application is missing its parent wholesaler tenant');
    }

    // Provision using the approving admin's context — same maker-checker/ABAC path as manual onboarding.
    const tenant = await this.tenants.create(
      admin,
      {
        name: application.orgName,
        type: plan.type,
        parentTenantId: application.requestedParentTenantId ?? undefined,
      },
      correlationId,
    );
    const issued = await this.clients.issue(
      admin,
      tenant.id,
      {
        name: `${application.orgName} integration`,
        scopes: plan.scopes,
        ownerEmail: application.contactEmail,
      },
      correlationId,
    );
    // The issued secret is intentionally discarded — the partner generates their own (shown once)
    // from the dashboard. We link only the client's internal id.

    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data: {
        status: 'PROVISIONED',
        reviewedBy: admin.email,
        tenantId: tenant.id,
        apiClientId: issued.id,
      },
    });
    await this.prisma.partnerUser.updateMany({
      where: { applicationId: id },
      data: { tenantId: tenant.id },
    });
    await this.audit.record({
      tenantId: tenant.id,
      actor: admin.email,
      action: 'partner.application.approved',
      resourceType: 'partner_application',
      resourceId: id,
      correlationId,
      metadata: { orgName: application.orgName, integrationType: application.integrationType, clientId: issued.clientId },
    });
    await this.mailer.send({
      to: application.contactEmail,
      subject: 'Your PayChain partner application is approved',
      html: `<p>Good news — your PayChain integration for <b>${escapeHtml(application.orgName)}</b> is approved.</p><p>Your client id is <b>${issued.clientId}</b>. Sign in at <a href="${this.config.PARTNER_PORTAL_URL}/onboarding">${this.config.PARTNER_PORTAL_URL}/onboarding</a> to generate your API secret (shown once) and follow the integration steps.</p>`,
      text: `Your PayChain integration for ${application.orgName} is approved. Client id: ${issued.clientId}. Sign in at ${this.config.PARTNER_PORTAL_URL}/onboarding to generate your API secret and follow the steps.`,
    });
    return { id: updated.id, status: updated.status, tenantId: tenant.id, clientId: issued.clientId };
  }

  async reject(admin: AdminContext, id: string, reason: string, correlationId: string) {
    const application = await this.prisma.partnerApplication.findUnique({ where: { id } });
    if (!application) throw new BadRequestException('Application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException(`Application is not pending (status=${application.status})`);
    }
    const updated = await this.prisma.partnerApplication.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy: admin.email, rejectionReason: reason },
    });
    await this.audit.record({
      actor: admin.email,
      action: 'partner.application.rejected',
      resourceType: 'partner_application',
      resourceId: id,
      correlationId,
      metadata: { orgName: application.orgName, reason },
    });
    await this.mailer.send({
      to: application.contactEmail,
      subject: 'Update on your PayChain partner application',
      html: `<p>Thank you for your interest in PayChain. After review, we are not able to proceed with your application for <b>${escapeHtml(application.orgName)}</b> at this time.</p><p>${escapeHtml(reason)}</p>`,
      text: `After review, we are not able to proceed with your PayChain application for ${application.orgName} at this time. ${reason}`,
    });
    return { id: updated.id, status: updated.status };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
