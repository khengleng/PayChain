import type { PrismaClient } from '@prisma/client';
import {
  AUDIT_GENESIS_HASH,
  appendAuditLog,
  canonicalAuditPayload,
  computeAuditEntryHash,
  stableStringify,
  verifyAuditChain,
} from './audit-chain';

/**
 * An in-memory stand-in for the audit_logs table. It deliberately allows mutation and deletion
 * so the tests can play the attacker: the database triggers prevent that in production, but the
 * hash chain is the control that has to *detect* it when they are bypassed. Verifying against a
 * table that refused edits would prove nothing.
 */
type Row = Record<string, unknown>;

function fakePrisma() {
  const rows: Row[] = [];
  const sortAsc = (a: Row, b: Row) => Number((a.seq as bigint) - (b.seq as bigint));

  const client = {
    rows,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(client),
    $executeRaw: async () => 1,
    auditLog: {
      create: async ({ data }: { data: Row }) => {
        rows.push({ ...data });
        return data;
      },
      findFirst: async ({ orderBy }: { orderBy?: { seq?: 'asc' | 'desc' } }) => {
        const chained = rows.filter((r) => r.seq != null).sort(sortAsc);
        if (chained.length === 0) return null;
        return orderBy?.seq === 'desc' ? chained[chained.length - 1] : chained[0];
      },
      findMany: async ({ where }: { where?: { seq?: { gt?: bigint } } }) => {
        let out = rows.filter((r) => r.seq != null).sort(sortAsc);
        const gt = where?.seq?.gt;
        if (gt !== undefined) out = out.filter((r) => (r.seq as bigint) > gt);
        return out;
      },
      count: async ({ where }: { where?: { entryHash?: null } }) =>
        where?.entryHash === null ? rows.filter((r) => r.entryHash == null).length : rows.length,
    },
  };
  return client as unknown as PrismaClient & { rows: Row[] };
}

const entry = (n: number) => ({
  tenantId: 't1',
  actor: 'ops@paychain.dev',
  action: `admin.action.${n}`,
  resourceType: 'wallet',
  resourceId: `w${n}`,
  correlationId: `corr-${n}`,
  metadata: { from: 'ACTIVE', to: 'FROZEN' },
});

describe('audit chain — canonical serialization', () => {
  it('sorts object keys recursively so the hash does not depend on insertion order', () => {
    const a = stableStringify({ b: 1, a: { d: 2, c: 3 } });
    const b = stableStringify({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('preserves array order, which is meaningful', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
  });

  it('normalizes undefined and null identically so neither can masquerade as the other', () => {
    expect(stableStringify({ a: undefined })).toBe(stableStringify({}));
    expect(stableStringify(null)).toBe('null');
  });

  it('produces a stable, documented pre-image an auditor can reproduce by hand', () => {
    const payload = canonicalAuditPayload({
      ...entry(1),
      seq: 1n,
      prevHash: AUDIT_GENESIS_HASH,
      createdAt: new Date('2026-07-16T00:00:00.000Z'),
    });
    expect(payload).toContain('"seq":"1"');
    expect(payload).toContain(`"prevHash":"${AUDIT_GENESIS_HASH}"`);
    expect(payload).toContain('"createdAt":"2026-07-16T00:00:00.000Z"');
    // Key order is alphabetical throughout.
    expect(payload.indexOf('"action"')).toBeLessThan(payload.indexOf('"actor"'));
  });
});

describe('audit chain — append', () => {
  it('starts at seq 1 linked to the genesis hash', async () => {
    const prisma = fakePrisma();
    await appendAuditLog(prisma, entry(1));
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.rows[0]!.seq).toBe(1n);
    expect(prisma.rows[0]!.prevHash).toBe(AUDIT_GENESIS_HASH);
    expect(prisma.rows[0]!.entryHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('links each entry to its predecessor', async () => {
    const prisma = fakePrisma();
    await appendAuditLog(prisma, entry(1));
    await appendAuditLog(prisma, entry(2));
    await appendAuditLog(prisma, entry(3));
    expect(prisma.rows.map((r) => r.seq)).toEqual([1n, 2n, 3n]);
    expect(prisma.rows[1]!.prevHash).toBe(prisma.rows[0]!.entryHash);
    expect(prisma.rows[2]!.prevHash).toBe(prisma.rows[1]!.entryHash);
  });
});

describe('audit chain — verification detects tampering', () => {
  async function chainOf(n: number) {
    const prisma = fakePrisma();
    for (let i = 1; i <= n; i += 1) await appendAuditLog(prisma, entry(i));
    return prisma;
  }

  it('verifies an intact chain and reports the head hash', async () => {
    const prisma = await chainOf(5);
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(true);
    expect(res.verified).toBe(5);
    expect(res.unchainedLegacy).toBe(0);
    expect(res.headHash).toBe(prisma.rows[4]!.entryHash);
  });

  it('verifies an empty chain', async () => {
    const res = await verifyAuditChain(fakePrisma());
    expect(res.ok).toBe(true);
    expect(res.verified).toBe(0);
  });

  it('detects an edited entry — the classic "just change who did it"', async () => {
    const prisma = await chainOf(4);
    prisma.rows[1]!.actor = 'someone-else@evil.dev';
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe('2');
    expect(res.reason).toContain('content altered');
  });

  it('detects an edited metadata value, not just top-level fields', async () => {
    const prisma = await chainOf(3);
    prisma.rows[2]!.metadata = { from: 'ACTIVE', to: 'ACTIVE' };
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe('3');
  });

  it('detects a backdated entry', async () => {
    const prisma = await chainOf(3);
    prisma.rows[0]!.createdAt = new Date('2020-01-01T00:00:00.000Z');
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe('1');
  });

  it('detects a deleted entry as a sequence gap', async () => {
    const prisma = await chainOf(5);
    prisma.rows.splice(2, 1); // remove seq 3
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe('4');
    expect(res.reason).toContain('sequence gap');
  });

  it('detects a re-hashed entry whose link no longer matches (cover-up attempt)', async () => {
    const prisma = await chainOf(4);
    // Attacker edits an entry AND recomputes its own hash so it self-verifies. The chain still
    // breaks, because the *next* entry commits to the old hash.
    const row = prisma.rows[1]!;
    row.actor = 'someone-else@evil.dev';
    row.entryHash = computeAuditEntryHash({
      seq: row.seq as bigint,
      prevHash: row.prevHash as string,
      tenantId: row.tenantId as string,
      actor: row.actor as string,
      action: row.action as string,
      resourceType: row.resourceType as string,
      resourceId: row.resourceId as string,
      correlationId: row.correlationId as string,
      metadata: row.metadata,
      createdAt: row.createdAt as Date,
    });
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(false);
    expect(res.brokenAtSeq).toBe('3');
    expect(res.reason).toContain('broken link');
  });

  it('reports pre-chain legacy rows as unchained rather than as tampering', async () => {
    const prisma = await chainOf(2);
    prisma.rows.unshift({ id: 'legacy', actor: 'old', action: 'x', resourceType: 'y', seq: null, entryHash: null });
    const res = await verifyAuditChain(prisma);
    expect(res.ok).toBe(true);
    expect(res.verified).toBe(2);
    expect(res.unchainedLegacy).toBe(1);
  });
});
