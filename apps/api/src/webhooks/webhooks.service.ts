import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import type { AuthContext } from '../auth/auth-context';
import type { CreateWebhookEndpointDto } from './dto';

export interface WebhookEndpointView {
  id: string;
  url: string;
  events: string[];
  status: string;
  createdAt: Date;
}

/** The plaintext signing secret is returned exactly once, at create/rotate time (§35, §41). */
export interface WebhookEndpointWithSecret extends WebhookEndpointView {
  secret: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  async create(
    auth: AuthContext,
    dto: CreateWebhookEndpointDto,
    correlationId: string,
  ): Promise<WebhookEndpointWithSecret> {
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId: auth.tenantId,
        url: dto.url,
        secretEnc: this.crypto.encrypt(secret),
        events: dto.events,
        createdBy: auth.clientId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'webhook.create',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      correlationId,
      metadata: { url: endpoint.url, events: endpoint.events },
    });
    return { ...this.toView(endpoint), secret };
  }

  async list(auth: AuthContext): Promise<WebhookEndpointView[]> {
    const rows = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async remove(auth: AuthContext, id: string, correlationId: string): Promise<void> {
    const endpoint = await this.getOwned(auth.tenantId, id);
    await this.prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { status: 'DISABLED' },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'webhook.disable',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      correlationId,
    });
  }

  async rotateSecret(
    auth: AuthContext,
    id: string,
    correlationId: string,
  ): Promise<WebhookEndpointWithSecret> {
    const endpoint = await this.getOwned(auth.tenantId, id);
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    const updated = await this.prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: { secretEnc: this.crypto.encrypt(secret) },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'webhook.rotate_secret',
      resourceType: 'webhook_endpoint',
      resourceId: endpoint.id,
      correlationId,
    });
    return { ...this.toView(updated), secret };
  }

  private async getOwned(tenantId: string, id: string) {
    const endpoint = await this.prisma.webhookEndpoint.findUnique({ where: { id } });
    if (!endpoint || endpoint.tenantId !== tenantId) {
      throw new NotFoundException('Webhook endpoint not found');
    }
    return endpoint;
  }

  private toView(e: {
    id: string;
    url: string;
    events: string[];
    status: string;
    createdAt: Date;
  }): WebhookEndpointView {
    return { id: e.id, url: e.url, events: e.events, status: e.status, createdAt: e.createdAt };
  }
}
