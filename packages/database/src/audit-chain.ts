import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

/**
 * Tamper-evident audit chain (§41).
 *
 * The database triggers (migration `add_audit_chain`) make `audit_logs` append-only, but a
 * trigger is only as strong as the DDL rights around it. The hash chain is the independent
 * control: every entry commits to the one before it, so any edit, deletion, or reordering
 * invalidates all subsequent links, and the break is *detectable* by anyone holding an earlier
 * copy of a hash — including a regulator who wrote one down.
 *
 * Both writers (the API's AuditService and the worker) must append through `appendAuditLog`,
 * or they would create unchained rows and silently weaken the guarantee.
 */

/** prevHash of the first entry in the chain. 64 hex zeros — never a real digest. */
export const AUDIT_GENESIS_HASH = '0'.repeat(64);

/** Advisory-lock key that serializes appends. Arbitrary but must be stable across processes. */
const AUDIT_CHAIN_LOCK_KEY = 8_474_101_001n;

export interface AuditEntryInput {
  tenantId?: string | null;
  actor: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  correlationId?: string | null;
  metadata?: unknown;
}

/** The exact fields covered by entryHash. Anything not listed here is not protected. */
export interface AuditChainedFields extends AuditEntryInput {
  seq: bigint;
  prevHash: string;
  createdAt: Date;
}

/**
 * Deterministic JSON: object keys sorted recursively, so an auditor recomputing a hash gets the
 * same bytes regardless of language or key insertion order. Arrays keep their order (it is
 * meaningful); undefined and null both normalize to null so absent and explicit-null cannot hash
 * differently and be passed off as one another.
 */
export function stableStringify(value: unknown): string {
  if (value === undefined || value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

/**
 * The canonical pre-image for an entry's hash. Stable and documented so it can be reproduced
 * outside this codebase; changing it invalidates every existing chain, so treat it as a
 * versioned format rather than an implementation detail.
 */
export function canonicalAuditPayload(fields: AuditChainedFields): string {
  return stableStringify({
    seq: fields.seq.toString(),
    prevHash: fields.prevHash,
    tenantId: fields.tenantId ?? null,
    actor: fields.actor,
    action: fields.action,
    resourceType: fields.resourceType,
    resourceId: fields.resourceId ?? null,
    correlationId: fields.correlationId ?? null,
    metadata: fields.metadata ?? {},
    createdAt: fields.createdAt.toISOString(),
  });
}

export function computeAuditEntryHash(fields: AuditChainedFields): string {
  return createHash('sha256').update(canonicalAuditPayload(fields), 'utf8').digest('hex');
}

/**
 * Append one sealed entry. Serialized by a transaction-scoped Postgres advisory lock: the chain
 * head must be read and extended atomically, or two concurrent appends would claim the same seq
 * and prevHash and fork the chain. The lock is released when the transaction commits or aborts.
 *
 * This makes audit appends globally serial, which is the cost of a single linear chain. At
 * PayChain's target throughput (§40, ~12 TPS average) that is not a bottleneck; if it ever
 * becomes one, the fix is per-tenant chains, not dropping the lock.
 */
export async function appendAuditLog(prisma: PrismaClient, entry: AuditEntryInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY}::bigint)`;

    const head = await tx.auditLog.findFirst({
      where: { seq: { not: null } },
      orderBy: { seq: 'desc' },
      select: { seq: true, entryHash: true },
    });

    const seq = head?.seq != null ? head.seq + 1n : 1n;
    const prevHash = head?.entryHash ?? AUDIT_GENESIS_HASH;
    const createdAt = new Date();
    const chained: AuditChainedFields = { ...entry, seq, prevHash, createdAt };

    await tx.auditLog.create({
      data: {
        tenantId: entry.tenantId ?? null,
        actor: entry.actor,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        correlationId: entry.correlationId ?? null,
        metadata: (entry.metadata ?? {}) as object,
        createdAt,
        seq,
        prevHash,
        entryHash: computeAuditEntryHash(chained),
      },
    });
  });
}

export interface AuditChainVerification {
  ok: boolean;
  /** Number of sealed entries whose hash and prev-link both verified. */
  verified: number;
  /** Pre-chain rows with no entryHash. Not tampering — they predate the chain. */
  unchainedLegacy: number;
  /** seq of the first entry that failed, if any. Everything after it is untrustworthy. */
  brokenAtSeq?: string;
  reason?: string;
  headHash?: string;
}

/**
 * Recompute the chain and report the first break. An auditor can run this, or reproduce it from
 * exported data using `canonicalAuditPayload` — the point is that the result does not depend on
 * trusting this process.
 */
export async function verifyAuditChain(prisma: PrismaClient): Promise<AuditChainVerification> {
  const unchainedLegacy = await prisma.auditLog.count({ where: { entryHash: null } });

  let prevHash = AUDIT_GENESIS_HASH;
  let expectedSeq = 1n;
  let verified = 0;
  const pageSize = 500;
  let cursorSeq: bigint | undefined;

  for (;;) {
    const page = await prisma.auditLog.findMany({
      where: { seq: cursorSeq === undefined ? { not: null } : { gt: cursorSeq } },
      orderBy: { seq: 'asc' },
      take: pageSize,
    });
    if (page.length === 0) break;

    for (const row of page) {
      if (row.seq !== expectedSeq) {
        return {
          ok: false,
          verified,
          unchainedLegacy,
          brokenAtSeq: String(row.seq),
          reason: `sequence gap: expected seq ${expectedSeq}, found ${row.seq} (entry removed or reordered)`,
        };
      }
      if (row.prevHash !== prevHash) {
        return {
          ok: false,
          verified,
          unchainedLegacy,
          brokenAtSeq: String(row.seq),
          reason: `broken link: prevHash does not match the previous entry's hash`,
        };
      }
      const recomputed = computeAuditEntryHash({
        seq: row.seq!,
        prevHash: row.prevHash!,
        tenantId: row.tenantId,
        actor: row.actor,
        action: row.action,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        correlationId: row.correlationId,
        metadata: row.metadata,
        createdAt: row.createdAt,
      });
      if (recomputed !== row.entryHash) {
        return {
          ok: false,
          verified,
          unchainedLegacy,
          brokenAtSeq: String(row.seq),
          reason: `content altered: recomputed hash does not match the stored entryHash`,
        };
      }
      prevHash = row.entryHash!;
      expectedSeq = row.seq! + 1n;
      cursorSeq = row.seq!;
      verified += 1;
    }
    if (page.length < pageSize) break;
  }

  return {
    ok: true,
    verified,
    unchainedLegacy,
    headHash: verified > 0 ? prevHash : undefined,
  };
}
