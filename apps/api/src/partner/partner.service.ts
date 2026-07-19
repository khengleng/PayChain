import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { generateClientSecret, hashClientSecret, hashPassword, verifyPassword } from '@paychain/security';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
import type { PartnerContext } from './partner-context';
import type { LoginPartnerDto, RegisterPartnerDto } from './dto';

const PARTNER_TOKEN_TTL_SECONDS = 3600;

export interface PartnerApplicationView {
  reference: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  integrationType: string;
  status: string;
  rejectionReason: string | null;
  clientId: string | null;
  createdAt: Date;
}

@Injectable()
export class PartnerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly mailer: MailerService,
    @Inject(CONFIG) private readonly config: PayChainConfig,
  ) {}

  /** Public self-service registration → a PENDING application + a login identity. */
  async register(dto: RegisterPartnerDto, correlationId: string): Promise<{ reference: string }> {
    if (dto.website) {
      // Honeypot tripped — behave like a normal success without creating anything (don't tip off bots).
      return { reference: `pa_${randomBytes(12).toString('hex')}` };
    }
    const email = dto.contactEmail.trim().toLowerCase();
    if (await this.prisma.partnerUser.findUnique({ where: { email } })) {
      throw new ConflictException('An application with this email already exists');
    }
    if (dto.integrationType === 'RETAILER' && !dto.requestedParentTenantId) {
      throw new BadRequestException('A retailer application must name a parent wholesaler tenant');
    }

    const reference = `pa_${randomBytes(12).toString('hex')}`;
    const application = await this.prisma.partnerApplication.create({
      data: {
        orgName: dto.orgName.trim(),
        contactName: dto.contactName.trim(),
        contactEmail: email,
        integrationType: dto.integrationType,
        requestedParentTenantId: dto.requestedParentTenantId ?? null,
        useCase: dto.useCase.trim(),
        reference,
        status: 'PENDING',
        correlationId,
      },
    });
    await this.prisma.partnerUser.create({
      data: { email, passwordHash: hashPassword(dto.password), applicationId: application.id },
    });
    await this.audit.record({
      actor: email,
      action: 'partner.application.submitted',
      resourceType: 'partner_application',
      resourceId: application.id,
      correlationId,
      metadata: { orgName: application.orgName, integrationType: application.integrationType },
    });
    await this.mailer.send({
      to: email,
      subject: 'PayChain partner application received',
      html: `<p>Hi ${escapeHtml(dto.contactName)},</p><p>We received your PayChain partner application for <b>${escapeHtml(dto.orgName)}</b> (${dto.integrationType}).</p><p>Track its status by signing in at <a href="${this.config.PARTNER_PORTAL_URL}/login">${this.config.PARTNER_PORTAL_URL}</a>. Your reference is <b>${reference}</b>.</p>`,
      text: `We received your PayChain partner application for ${dto.orgName} (${dto.integrationType}). Reference ${reference}. Track status at ${this.config.PARTNER_PORTAL_URL}/login`,
    });
    return { reference };
  }

  async login(dto: LoginPartnerDto): Promise<{ access_token: string; token_type: 'Bearer'; expires_in: number }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.partnerUser.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE' || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const access_token = await this.jwt.signAsync(
      { sub: user.id, typ: 'partner', email: user.email },
      { expiresIn: PARTNER_TOKEN_TTL_SECONDS },
    );
    return { access_token, token_type: 'Bearer', expires_in: PARTNER_TOKEN_TTL_SECONDS };
  }

  async me(partner: PartnerContext): Promise<PartnerApplicationView> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id: partner.applicationId },
    });
    if (!application) throw new UnauthorizedException('Application not found');
    let clientId: string | null = null;
    if (application.apiClientId) {
      const client = await this.prisma.apiClient.findUnique({
        where: { id: application.apiClientId },
        select: { clientId: true },
      });
      clientId = client?.clientId ?? null;
    }
    return {
      reference: application.reference,
      orgName: application.orgName,
      contactName: application.contactName,
      contactEmail: application.contactEmail,
      integrationType: application.integrationType,
      status: application.status,
      rejectionReason: application.rejectionReason,
      clientId,
      createdAt: application.createdAt,
    };
  }

  /**
   * The only way a partner obtains a secret: rotate their own provisioned client's secret and see
   * it once. Never emailed, never stored plaintext. Requires a PROVISIONED application.
   */
  async rotateCredentials(
    partner: PartnerContext,
    correlationId: string,
  ): Promise<{ clientId: string; clientSecret: string; warning: string }> {
    const application = await this.prisma.partnerApplication.findUnique({
      where: { id: partner.applicationId },
    });
    if (!application || application.status !== 'PROVISIONED' || !application.apiClientId) {
      throw new BadRequestException('Your application is not provisioned yet');
    }
    const client = await this.prisma.apiClient.findUnique({ where: { id: application.apiClientId } });
    if (!client) throw new BadRequestException('Provisioned client not found');

    const clientSecret = generateClientSecret();
    await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { clientSecretHash: hashClientSecret(clientSecret), tokenVersion: { increment: 1 } },
    });
    await this.audit.record({
      tenantId: client.tenantId,
      actor: partner.email,
      action: 'partner.credentials.rotated',
      resourceType: 'api_client',
      resourceId: client.id,
      correlationId,
      metadata: { clientId: client.clientId },
    });
    return {
      clientId: client.clientId,
      clientSecret,
      warning: 'Save this secret now — it is shown once and cannot be retrieved later. Rotate again if lost.',
    };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
