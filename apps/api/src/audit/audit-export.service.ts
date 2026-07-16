import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@paychain/database';
import { canonicalAuditPayload, verifyAuditChain } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditQuery {
  from?: string;
  to?: string;
  actor?: string;
  action?: string;
  tenantId?: string;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
  cursor?: string;
}

/** Hard ceiling on one page, so an export cannot be turned into an accidental table scan. */
const MAX_PAGE = 1000;
const DEFAULT_PAGE = 200;

/**
 * Explicit view types. These also stop Prisma's JsonValue from leaking into inferred controller
 * return types, which tsc cannot name portably across the workspace.
 */
export interface AuditRowView {
  seq: string | null;
  id: string;
  createdAt: string;
  tenantId: string | null;
  /** Resolved tenant name; the admin console renders this. */
  tenant: string | null;
  actor: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  correlationId: string | null;
  metadata: unknown;
  prevHash: string | null;
  entryHash: string | null;
}

export interface AuditPage {
  items: AuditRowView[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Regulator-facing audit export (§41). The point of this surface is that its output can be
 * checked *without trusting PayChain*: every row carries its seq/prevHash/entryHash, the export
 * ships the canonical pre-image used to hash each entry, and the manifest states the chain head
 * at the time of export. An auditor can recompute every hash offline and compare the head to one
 * they recorded earlier.
 */
@Injectable()
export class AuditExportService {
  constructor(private readonly prisma: PrismaService) {}

  private where(q: AuditQuery): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (q.tenantId) where.tenantId = q.tenantId;
    if (q.actor) where.actor = { contains: q.actor, mode: 'insensitive' };
    if (q.action) where.action = { contains: q.action, mode: 'insensitive' };
    if (q.resourceType) where.resourceType = q.resourceType;
    if (q.resourceId) where.resourceId = q.resourceId;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from) where.createdAt.gte = new Date(q.from);
      if (q.to) where.createdAt.lte = new Date(q.to);
    }
    return where;
  }

  private async tenantNames(): Promise<Map<string, string>> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
    return new Map(tenants.map((t) => [t.id, t.name]));
  }

  /**
   * Filtered, cursor-paginated read. Ordered by seq so pagination is stable under concurrent
   * appends — ordering by createdAt would let a new entry shift rows between pages.
   *
   * `tenant` (resolved name) is kept alongside `tenantId` because the admin console renders it;
   * dropping it here would break the audit-logs screen.
   */
  async query(q: AuditQuery): Promise<AuditPage> {
    const take = Math.min(Math.max(q.limit ?? DEFAULT_PAGE, 1), MAX_PAGE);
    const where = this.where(q);
    if (q.cursor) {
      where.seq = { lt: BigInt(q.cursor) };
    }

    const [rows, tenants] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { seq: 'desc' },
        take: take + 1, // one extra row tells us whether another page exists
      }),
      this.tenantNames(),
    ]);

    const hasMore = rows.length > take;
    const items = hasMore ? rows.slice(0, take) : rows;
    const last = items[items.length - 1];

    return {
      items: items.map((r) => ({
        seq: r.seq === null ? null : String(r.seq),
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        tenantId: r.tenantId,
        tenant: r.tenantId ? (tenants.get(r.tenantId) ?? r.tenantId) : null,
        actor: r.actor,
        action: r.action,
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        correlationId: r.correlationId,
        metadata: r.metadata,
        prevHash: r.prevHash,
        entryHash: r.entryHash,
      })),
      nextCursor: hasMore && last?.seq != null ? String(last.seq) : null,
      hasMore,
    };
  }

  /** Recompute the whole chain and report the first break. */
  async verify() {
    return verifyAuditChain(this.prisma);
  }

  /**
   * A self-describing evidence package. `exportHash` covers the returned rows, so the recipient
   * can prove later that the file they hold is the one issued; `chain` states whether the trail
   * verified at export time, and is included even when it fails — a broken chain is exactly the
   * thing an auditor must be told about, not an error to swallow.
   */
  async evidencePackage(q: AuditQuery, requestedBy: string) {
    const [page, chain] = await Promise.all([this.query({ ...q, limit: MAX_PAGE }), this.verify()]);
    const generatedAt = new Date().toISOString();
    const exportHash = createHash('sha256')
      .update(JSON.stringify(page.items), 'utf8')
      .digest('hex');

    return {
      manifest: {
        generatedAt,
        requestedBy,
        filters: q,
        entryCount: page.items.length,
        truncated: page.hasMore,
        exportHash,
        chain: {
          verified: chain.ok,
          entriesVerified: chain.verified,
          unchainedLegacyEntries: chain.unchainedLegacy,
          headHash: chain.headHash ?? null,
          brokenAtSeq: chain.brokenAtSeq ?? null,
          reason: chain.reason ?? null,
        },
        howToVerify:
          'For each entry, recompute sha256 of the canonical payload (see canonicalPayload) and ' +
          'compare to entryHash; then check each prevHash equals the previous entry\'s entryHash. ' +
          'Entries are ordered by descending seq here; verify in ascending seq order.',
      },
      items: page.items.map((item) => ({
        ...item,
        canonicalPayload:
          item.seq === null || item.prevHash === null
            ? null
            : canonicalAuditPayload({
                seq: BigInt(item.seq),
                prevHash: item.prevHash,
                tenantId: item.tenantId,
                actor: item.actor,
                action: item.action,
                resourceType: item.resourceType,
                resourceId: item.resourceId,
                correlationId: item.correlationId,
                metadata: item.metadata,
                createdAt: new Date(item.createdAt),
              }),
      })),
    };
  }

  /** CSV for auditors who want the trail in a spreadsheet rather than JSON. */
  async csv(q: AuditQuery): Promise<string> {
    const page = await this.query({ ...q, limit: MAX_PAGE });
    const header = [
      'seq',
      'createdAt',
      'tenantId',
      'actor',
      'action',
      'resourceType',
      'resourceId',
      'correlationId',
      'metadata',
      'prevHash',
      'entryHash',
    ];
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      // Quote always: audit values are free text and may contain commas, quotes, or newlines.
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = page.items.map((r) =>
      [
        r.seq,
        r.createdAt,
        r.tenantId,
        r.actor,
        r.action,
        r.resourceType,
        r.resourceId,
        r.correlationId,
        r.metadata,
        r.prevHash,
        r.entryHash,
      ]
        .map(escape)
        .join(','),
    );
    return [header.join(','), ...lines].join('\n');
  }
}
