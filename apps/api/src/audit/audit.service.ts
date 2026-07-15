import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  tenantId?: string;
  actor: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit trail (§41). Every privileged/financial action records an entry.
 * Audit writes never contain secrets (§41) — callers pass only safe metadata.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        actor: entry.actor,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        correlationId: entry.correlationId,
        metadata: (entry.metadata ?? {}) as object,
      },
    });
  }
}
