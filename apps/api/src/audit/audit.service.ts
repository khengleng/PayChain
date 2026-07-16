import { Injectable } from '@nestjs/common';
import { appendAuditLog, verifyAuditChain, type AuditChainVerification } from '@paychain/database';
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
 *
 * Entries are sealed into a hash chain and the table rejects UPDATE/DELETE at the database
 * level (see packages/database/src/audit-chain.ts and the m10_audit_chain migration). Always
 * append through here rather than touching prisma.auditLog directly: a raw create would leave
 * an unchained row and weaken the guarantee for everything after it.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await appendAuditLog(this.prisma, entry);
  }

  /** Recompute the chain and report the first break, if any (§41). */
  async verify(): Promise<AuditChainVerification> {
    return verifyAuditChain(this.prisma);
  }
}
