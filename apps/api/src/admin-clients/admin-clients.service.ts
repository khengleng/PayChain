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
  ownerEmail: string | null;
  lastTokenIssuedAt: Date | null;
  lastApiRequestAt: Date | null;
  requestCount24h: number;
  errorCount24h: number;
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
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await this.prisma.apiClient.findMany({
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
        ownerEmail: true,
        lastTokenIssuedAt: true,
        lastApiRequestAt: true,
        createdAt: true,
        updatedAt: true,
        // clientSecretHash is deliberately never selected — it must not reach a response body,
        // a log, or a developer's console tab.
      },
    });
    const [counts24h, errors24h] = await Promise.all([
      this.prisma.apiClientRequestLog.groupBy({
        by: ['apiClientId'],
        where: { tenantId, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.apiClientRequestLog.groupBy({
        by: ['apiClientId'],
        where: { tenantId, createdAt: { gte: since }, statusCode: { gte: 400 } },
        _count: { _all: true },
      }),
    ]);
    const requestCountById = new Map(counts24h.map((row) => [row.apiClientId, row._count._all]));
    const errorCountById = new Map(errors24h.map((row) => [row.apiClientId, row._count._all]));
    return rows.map((row) => ({
      ...row,
      requestCount24h: requestCountById.get(row.id) ?? 0,
      errorCount24h: errorCountById.get(row.id) ?? 0,
    }));
  }

  async issue(
    admin: AdminContext,
    tenantId: string,
    input: { name: string; scopes: string[]; clientIdPrefix?: string; ownerEmail?: string },
    correlationId: string,
  ): Promise<IssuedClient> {
    assertPermittedByAttributes(admin, { tenantId });

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const scopes = this.validateScopes(input.scopes);
    this.assertOwnerForSensitiveScopes(scopes, input.ownerEmail);

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
        tokenVersion: 1,
        createdBy: admin.email,
        ownerEmail: input.ownerEmail?.toLowerCase() ?? null,
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
        ownerEmail: input.ownerEmail ?? null,
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
      data: {
        clientSecretHash: hashClientSecret(clientSecret),
        tokenVersion: { increment: 1 },
      },
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
      data: { status, tokenVersion: { increment: 1 } },
      select: {
        id: true,
        clientId: true,
        name: true,
        tenantId: true,
        scopes: true,
        status: true,
        createdBy: true,
        ownerEmail: true,
        lastTokenIssuedAt: true,
        lastApiRequestAt: true,
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

    return { ...updated, requestCount24h: 0, errorCount24h: 0 };
  }

  async updateScopes(
    admin: AdminContext,
    id: string,
    scopes: string[],
    correlationId: string,
  ): Promise<ApiClientView> {
    const client = await this.requireClient(admin, id);
    const next = this.validateScopes(scopes);
    // Otherwise a sensitive scope could be added later to a credential with no accountable
    // owner, side-stepping the check at issuance.
    this.assertOwnerForSensitiveScopes(next, client.ownerEmail ?? undefined);

    const updated = await this.prisma.apiClient.update({
      where: { id: client.id },
      data: { scopes: next, tokenVersion: { increment: 1 } },
      select: {
        id: true,
        clientId: true,
        name: true,
        tenantId: true,
        scopes: true,
        status: true,
        createdBy: true,
        ownerEmail: true,
        lastTokenIssuedAt: true,
        lastApiRequestAt: true,
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

    return { ...updated, requestCount24h: 0, errorCount24h: 0 };
  }

  /**
   * A credential that can move or authorize value must have a named human behind it, or
   * maker-checker cannot be enforced when a human later approves what it requested (see
   * TreasuryService.adminApprove). Requiring it at issuance keeps that check from failing closed
   * at the worst moment — mid-approval, on a real movement.
   */
  private assertOwnerForSensitiveScopes(scopes: ApiScope[], ownerEmail?: string): void {
    const sensitive = scopes.filter((s) => (SENSITIVE_SCOPES as string[]).includes(s));
    if (sensitive.length > 0 && !ownerEmail) {
      throw new BadRequestException(
        `An accountable owner (ownerEmail) is required for a credential holding sensitive ` +
          `scope(s): ${sensitive.join(', ')}. Without one, separation of duties cannot be ` +
          `enforced when a human approves what this credential requests.`,
      );
    }
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
