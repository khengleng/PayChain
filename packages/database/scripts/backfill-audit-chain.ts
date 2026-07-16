/**
 * One-time backfill: seal pre-chain audit rows into the hash chain (§41).
 *
 * Rows written before the m10_audit_chain migration have no seq/prevHash/entryHash. They are
 * genuine history, so we chain them rather than discard them — but the honest caveat is that
 * sealing them now proves only that they have not changed *since this ran*, not that they were
 * never altered before it. State that plainly when handing the trail to an auditor; the
 * verification output reports the boundary via `unchainedLegacy`.
 *
 * Ordering is (createdAt, id): createdAt is the real event order, and id breaks ties
 * deterministically so a re-run produces an identical chain.
 *
 * Safe to re-run: rows that already carry an entryHash are skipped, and the append-only trigger
 * would reject re-sealing them anyway.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/backfill-audit-chain.ts [--dry-run]
 */
import { createPrismaClient } from '../src/index';
import { AUDIT_GENESIS_HASH, computeAuditEntryHash, verifyAuditChain } from '../src/audit-chain';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = createPrismaClient(process.env.DATABASE_URL);

  const legacy = await prisma.auditLog.findMany({
    where: { entryHash: null },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  if (legacy.length === 0) {
    console.log('No unchained audit rows. Nothing to do.');
    const res = await verifyAuditChain(prisma);
    console.log('Chain verification:', JSON.stringify(res, null, 2));
    await prisma.$disconnect();
    return;
  }

  const head = await prisma.auditLog.findFirst({
    where: { seq: { not: null } },
    orderBy: { seq: 'desc' },
    select: { seq: true, entryHash: true },
  });

  // Legacy rows predate every chained row, so sealing them after an existing chain head would
  // put them out of time order. Refuse rather than silently produce a misleading trail.
  if (head) {
    console.error(
      `Refusing to backfill: the chain already has ${head.seq} sealed entries. Backfill must run ` +
        `before any new entry is appended, or the legacy rows (which are older) would be sealed ` +
        `after newer ones and the chain order would misrepresent history.`,
    );
    process.exit(1);
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Sealing ${legacy.length} legacy audit rows...`);

  let prevHash = AUDIT_GENESIS_HASH;
  let seq = 1n;

  for (const row of legacy) {
    const entryHash = computeAuditEntryHash({
      seq,
      prevHash,
      tenantId: row.tenantId,
      actor: row.actor,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      correlationId: row.correlationId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    });

    if (!dryRun) {
      await prisma.auditLog.update({
        where: { id: row.id },
        data: { seq, prevHash, entryHash },
      });
    }

    prevHash = entryHash;
    seq += 1n;
  }

  console.log(`${dryRun ? '[dry-run] Would seal' : 'Sealed'} ${legacy.length} rows. Head: ${prevHash}`);

  if (!dryRun) {
    const res = await verifyAuditChain(prisma);
    console.log('Chain verification:', JSON.stringify(res, null, 2));
    if (!res.ok) process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error('Backfill failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
