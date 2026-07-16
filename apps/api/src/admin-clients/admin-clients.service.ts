import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ApiClientStatus } from '@paychain/database';
import { generateClientId, generateClientSecret, hashClientSecret } from '@paychain/security';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertPermittedByAttributes } from '../admin-auth/abac';
import type { AdminContext } from '../admin-auth/admin-context';
import { SENSITIVE_SCOPES, isApiScope, type ApiScope } from './api-scopes';

export interface IssuedClient {
  id: string;
  clientId: string;
  /** Returned ONCE, at issuance or rotation. Never retrievable afterwards. */
  clientSecret: string;
  name: string;
  tenantId: string;
  scopes: string[];
  warning: string;
}

export interface ApiClientView {
  id: string;
  clientId: string;
  name: string;
  tenantId: string;
  scopes: string[];
  status: ApiClientStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API client issuance (§34) — the flow that lets a partner such as PayKH actually integrate.
 *
 * Until now the only writer of api_clients was the dev seed script, so production credentials
 * could only be created by inserting rows by hand: unaudited, unattributable, and impossible to
 * delegate safely. Every action here is ABAC-scoped to the tenant and written to the audit chain.
 *
 * The secret is generated, hashed with scrypt, and returned exactly once. We cannot show it again
 * because we do not store it — that is the point. Losing it means rotation, not recovery.
 */
@Injectable()
export class AdminClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(admin: AdminContext, tenantId: string): Promise<ApiClientView[]> {
    assertPermittedByAttributes(admin, { tenantId });
    return this.prisma.apiClient.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientId: true,
        name: true,
        tenantId: true,
        scopes: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        // clientSecretHash is deliberately never selected — it must not reach a response body,
        // a log, or a developer's console tab.
      },
    });
  }

  async issue(
    admin: AdminContext,
    tenantId: string,
    input: { name: string; scopes: string[]; clientIdPrefix?: string },
    correlationId: string,
  ): Promise<IssuedClient> {
    assertPermittedByAttributes(admin, { tenantId });

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const scopes = this.validateScopes(input.scopes);

    const clientId = generateClientId(input.clientIdPrefix?.trim() || 'pc');
    const clientSecret = generateClientSecret();

    const created = await this.prisma.apiClient.create({
      data: {
        tenantId,
        name: input.name,
        clientId,
        clientSecretHash: hashClientSecret(clientSecret),
        scopes,
        status: 'ACTIVE',
        createdBy: admin.email,
      },
    });

    await this.audit.record({
      tenantId,
      actor: admin.email,
      action: 'api_client.issued',
      resourceType: 'api_client',
      resourceId: created.id,
      correlationId,
      metadata: {
        clientId,
        name: input.name,
        scopes,
        // Surfaced so a reviewer can find privileged grants without re-deriving the rule.
        sensitiveScopes: scopes.filter((s) => (SENSITIVE_SCOPES as string[]).includes(s)),
        role: admin.role,
      },
    });

    return {
      id: created.id,
      clientId,
      clientSecret,
      name: created.name,
      tenantId,
      scopes,
      warning:
        'This secret is shown once and is not stored — it cannot be retrieved later. Save it now; ' +
        'if it is lost, rotate the client rather than issuing a new one.',
    };
  }

  /**
   * Issues a new secret for an existing client, invalidating the old one immediately. The
   * recovery path for a lost or leaked secret — the client id and its scopes stay stable, so
   * the partner changes one env var rather than re-onboarding.
   */
  async rotateSecret(admin: AdminContext, id: string, correlationId: string): Promise<IssuedClient> {
    const client = await this.requireClient(admin, id);
    const clientSecret = generateClientSecret();

    await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { clientSecretHash: hashClientSecret(clientSecret) },
    });

    await this.audit.record({
      tenantId: client.tenantId,
      actor: admin.email,
      action: 'api_client.secret_rotated',
      resourceType: 'api_client',
      resourceId: client.id,
      correlationId,
      metadata: { clientId: client.clientId, name: client.name, role: admin.role },
    });

    return {
      id: client.id,
      clientId: client.clientId,
      clientSecret,
      name: client.name,
      tenantId: client.tenantId,
      scopes: client.scopes,
      warning:
        'The previous secret stopped working the moment this was issued. This one is shown once.',
    };
  }

  /** Revokes a client. Tokens already minted stay valid until they expire — see the note below. */
  async setStatus(
    admin: AdminContext,
    id: string,
    status: ApiClientStatus,
    correlationId: string,
  ): Promise<ApiClientView> {
    const client = await this.requireClient(admin, id);
    if (client.status === status) {
      throw new ConflictException(`Client is already ${status}`);
    }

    const updated = await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { status },
      select: {
        id: true,
        clientId: true,
        name: true,
        tenantId: true,
        scopes: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.record({
      tenantId: client.tenantId,
      actor: admin.email,
      action: status === 'ACTIVE' ? 'api_client.reactivated' : 'api_client.revoked',
      resourceType: 'api_client',
      resourceId: client.id,
      correlationId,
      metadata: { clientId: client.clientId, from: client.status, to: status, role: admin.role },
    });

    return updated;
  }

  async updateScopes(
    admin: AdminContext,
    id: string,
    scopes: string[],
    correlationId: string,
  ): Promise<ApiClientView> {
    const client = await this.requireClient(admin, id);
    const next = this.validateScopes(scopes);

    const updated = await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { scopes: next },
      select: {
        id: true,
        clientId: true,
        name: true,
        tenantId: true,
        scopes: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.audit.record({
      tenantId: client.tenantId,
      actor: admin.email,
      action: 'api_client.scopes_changed',
      resourceType: 'api_client',
      resourceId: client.id,
      correlationId,
      metadata: {
        clientId: client.clientId,
        from: client.scopes,
        to: next,
        added: next.filter((s) => !client.scopes.includes(s)),
        removed: client.scopes.filter((s) => !(next as string[]).includes(s)),
        role: admin.role,
      },
    });

    return updated;
  }

  private validateScopes(scopes: string[]): ApiScope[] {
    if (!Array.isArray(scopes) || scopes.length === 0) {
      throw new BadRequestException('At least one scope is required');
    }
    const unknown = scopes.filter((s) => !isApiScope(s));
    if (unknown.length > 0) {
      // Fail loudly: an unknown scope in a credential is not a harmless typo, it is a permission
      // the caller believes they granted and that will silently deny every request.
      throw new BadRequestException(`Unknown scope(s): ${unknown.join(', ')}`);
    }
    return [...new Set(scopes.filter(isApiScope))];
  }

  private async requireClient(admin: AdminContext, id: string) {
    const client = await this.prisma.apiClient.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('API client not found');
    assertPermittedByAttributes(admin, { tenantId: client.tenantId });
    return client;
  }
}
