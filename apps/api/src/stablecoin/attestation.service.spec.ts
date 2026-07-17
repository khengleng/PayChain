import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttestationService } from './attestation.service';
import type { AuthContext } from '../auth/auth-context';

const auth: AuthContext = { tenantId: 't1', clientId: 'treasury', scopes: [] };
const HASH = 'a'.repeat(64);
const SNAP = { id: 's1', tenantId: 't1', assetId: 'a1', reserveRatio: '1.050000', snapshotHash: 'b'.repeat(64) };

function build(opts: { snapshot?: Record<string, unknown> | null; prior?: Record<string, unknown> | null; rows?: Record<string, unknown>[] } = {}) {
  const created: Record<string, any>[] = [];
  const updated: Record<string, any>[] = [];
  const tx = {
    attestation: {
      update: async (a: Record<string, any>) => { updated.push(a); return {}; },
      create: async ({ data }: { data: Record<string, any> }) => { created.push(data); return { id: 'at1', ...data }; },
    },
  };
  const prisma = {
    reserveSnapshot: { findUnique: async () => (opts.snapshot === undefined ? SNAP : opts.snapshot) },
    attestation: {
      findFirst: async () => opts.prior ?? null,
      findMany: async () => opts.rows ?? [],
    },
    $transaction: async (fn: (t: unknown) => Promise<unknown>) => fn(tx),
  } as never;
  const audit = { record: jest.fn() };
  return { svc: new AttestationService(prisma, audit as never), created, updated, audit };
}

const input = (over: Record<string, unknown> = {}) => ({
  assetId: 'a1', identifier: 'Q3-2026', documentHash: HASH, auditorReference: 'AUD-1',
  reserveSnapshotId: 's1', effectiveAt: new Date('2026-07-01'), ...over,
});

describe('AttestationService — the document never enters PayChain (§24)', () => {
  it('REFUSES anything that is not a bare SHA-256 digest', async () => {
    const { svc } = build();
    // A caller sending a document body is trying to store evidence here; evidence stays with
    // the auditor. "never place confidential bank documents on-chain" is satisfied by the
    // document never being accepted at all.
    for (const bad of ['not-a-hash', '', 'BEGIN PDF...', 'a'.repeat(63)]) {
      await expect(svc.publish(auth, input({ documentHash: bad }) as never, 'c')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
  });

  it('stores the hash normalised, and the snapshot hash alongside it', async () => {
    const { svc, created } = build();
    await svc.publish(auth, input({ documentHash: HASH.toUpperCase() }), 'c');
    expect(created[0]).toMatchObject({
      documentHash: HASH, // lowercased
      snapshotHash: SNAP.snapshotHash,
      reserveSnapshotId: 's1',
      reserveRatio: '1.050000', // taken from the snapshot, not the caller
      status: 'ACTIVE',
    });
  });
});

describe('AttestationService — it attests to specific figures (§24)', () => {
  it('REFUSES to attest to a snapshot that does not exist', async () => {
    const { svc } = build({ snapshot: null });
    await expect(svc.publish(auth, input(), 'c')).rejects.toBeInstanceOf(NotFoundException);
  });

  it("REFUSES another tenant's snapshot", async () => {
    const { svc } = build({ snapshot: { ...SNAP, tenantId: 'OTHER' } });
    await expect(svc.publish(auth, input(), 'c')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('REFUSES a snapshot for a different asset', async () => {
    const { svc } = build({ snapshot: { ...SNAP, assetId: 'OTHER' } });
    await expect(svc.publish(auth, input(), 'c')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('REFUSES an unhashed snapshot — there is nothing to bind the claim to', async () => {
    const { svc } = build({ snapshot: { ...SNAP, snapshotHash: null } });
    await expect(svc.publish(auth, input(), 'c')).rejects.toThrow(/no hash/);
  });

  it('REFUSES an expiry that precedes its effective date', async () => {
    const { svc } = build();
    await expect(
      svc.publish(auth, input({ expiresAt: new Date('2026-06-01') }), 'c'),
    ).rejects.toThrow(/after effectiveAt/);
  });
});

describe('AttestationService — versioning supersedes, never edits', () => {
  it('supersedes the prior version rather than rewriting it', async () => {
    const { svc, created, updated } = build({ prior: { id: 'at0', version: 2 } });
    const a = await svc.publish(auth, input(), 'c');
    expect(a.version).toBe(3);
    // An attestation is a statement someone made at a time. Editing it is the one thing it must
    // not permit.
    expect(updated[0]).toMatchObject({ where: { id: 'at0' }, data: { status: 'SUPERSEDED' } });
    expect(created[0]!.version).toBe(3);
  });

  it('starts at version 1 for a new identifier', async () => {
    const { svc, created } = build({ prior: null });
    await svc.publish(auth, input(), 'c');
    expect(created[0]!.version).toBe(1);
  });

  it('audits the publication with both hashes and what it superseded', async () => {
    const { svc, audit } = build({ prior: { id: 'at0', version: 1 } });
    await svc.publish(auth, input(), 'c');
    expect(audit.record.mock.calls[0]![0].metadata).toMatchObject({
      documentHash: HASH, snapshotHash: SNAP.snapshotHash, supersededVersion: 1, auditorReference: 'AUD-1',
    });
  });
});

describe('AttestationService.current — expiry is evaluated on read', () => {
  const active = (over: Record<string, unknown> = {}) => ({
    id: 'at1', status: 'ACTIVE', version: 1, effectiveAt: new Date('2026-01-01'), expiresAt: null, ...over,
  });

  it('returns null once expired, without waiting for a sweep', async () => {
    // An attestation does not become stale because a job noticed. A caller must never see an
    // expired one as current merely because nothing has run yet.
    const prisma = { attestation: { findFirst: async () => active({ expiresAt: new Date('2026-06-01') }) } } as never;
    const svc = new AttestationService(prisma, { record: jest.fn() } as never);
    expect(await svc.current('t1', 'a1', new Date('2026-07-01'))).toBeNull();
  });

  it('returns the attestation while it is in force', async () => {
    const prisma = { attestation: { findFirst: async () => active({ expiresAt: new Date('2026-12-01') }) } } as never;
    const svc = new AttestationService(prisma, { record: jest.fn() } as never);
    expect(await svc.current('t1', 'a1', new Date('2026-07-01'))).toMatchObject({ id: 'at1' });
  });

  it('returns null when none exists — silence, not a fabricated default', async () => {
    const prisma = { attestation: { findFirst: async () => null } } as never;
    const svc = new AttestationService(prisma, { record: jest.fn() } as never);
    expect(await svc.current('t1', 'a1')).toBeNull();
  });
});
