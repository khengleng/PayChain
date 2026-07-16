import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { verifyClientSecret } from '@paychain/security';
import { AdminClientsService } from './admin-clients.service';
import type { AdminContext } from '../admin-auth/admin-context';

const admin = (attributes: Record<string, unknown> = {}): AdminContext => ({
  userId: 'u1',
  email: 'ops@paychain.dev',
  role: 'OPERATIONS_ADMIN',
  permissions: [],
  attributes,
});

function fakePrisma() {
  const clients: Record<string, Record<string, unknown>> = {};
  let n = 0;
  return {
    clients,
    tenant: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        where.id === 't1' ? { id: 't1', name: 'PayKH Sandbox' } : null,
    },
    apiClient: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        n += 1;
        const row = { id: `c${n}`, createdAt: new Date(), updatedAt: new Date(), ...data };
        clients[row.id] = row;
        return row;
      },
      findUnique: async ({ where }: { where: { id: string } }) => clients[where.id] ?? null,
      // Honours `select` like the real client does, so a test asserting the secret hash never
      // leaves the service is actually testing the service's select clause rather than the fake.
      findMany: async ({ select }: { select?: Record<string, boolean> } = {}) =>
        Object.values(clients).map((row) =>
          select
            ? Object.fromEntries(
                Object.entries(row).filter(([k]) => select[k] === true),
              )
            : row,
        ),
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        clients[where.id] = { ...clients[where.id], ...data };
        return clients[where.id];
      },
    },
  };
}

function build() {
  const prisma = fakePrisma();
  const audit = { record: jest.fn() };
  return { svc: new AdminClientsService(prisma as never, audit as never), prisma, audit };
}

const LOYALTY = ['wallet.read', 'wallet.write', 'asset.issue'];

describe('AdminClientsService — issuing partner credentials (§34)', () => {
  it('issues a client and returns the secret exactly once', async () => {
    const { svc } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');

    expect(issued.clientId).toMatch(/^pc_[A-Za-z0-9_-]+$/);
    expect(issued.clientSecret.length).toBeGreaterThanOrEqual(43);
    expect(issued.warning).toMatch(/shown once/i);
  });

  it('stores only a scrypt hash — the secret itself is never persisted', async () => {
    const { svc, prisma } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');

    const stored = prisma.clients[issued.id]!;
    expect(stored.clientSecretHash).not.toBe(issued.clientSecret);
    expect(String(stored.clientSecretHash)).toMatch(/^scrypt\$/);
    // The issued secret must actually authenticate against what we stored.
    expect(verifyClientSecret(issued.clientSecret, String(stored.clientSecretHash)).ok).toBe(true);
  });

  it('never returns the secret hash from list()', async () => {
    const { svc } = build();
    await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');
    const rows = await svc.list(admin(), 't1');
    for (const r of rows) expect(r).not.toHaveProperty('clientSecretHash');
  });

  it('issues unique credentials every time', async () => {
    const { svc } = build();
    const a = await svc.issue(admin(), 't1', { name: 'A', scopes: LOYALTY }, 'corr');
    const b = await svc.issue(admin(), 't1', { name: 'B', scopes: LOYALTY }, 'corr');
    expect(a.clientId).not.toBe(b.clientId);
    expect(a.clientSecret).not.toBe(b.clientSecret);
  });

  it('supports a prefix so credentials are identifiable in logs', async () => {
    const { svc } = build();
    const issued = await svc.issue(
      admin(),
      't1',
      { name: 'PayKH', scopes: LOYALTY, clientIdPrefix: 'paykh' },
      'corr',
    );
    expect(issued.clientId).toMatch(/^paykh_/);
  });

  it('rejects unknown scopes rather than silently persisting a typo', async () => {
    const { svc } = build();
    await expect(
      svc.issue(admin(), 't1', { name: 'PayKH', scopes: ['wallet.wirte'] }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty scope list', async () => {
    const { svc } = build();
    await expect(svc.issue(admin(), 't1', { name: 'X', scopes: [] }, 'corr')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deduplicates scopes', async () => {
    const { svc } = build();
    const issued = await svc.issue(
      admin(),
      't1',
      { name: 'X', scopes: ['wallet.read', 'wallet.read'] },
      'corr',
    );
    expect(issued.scopes).toEqual(['wallet.read']);
  });

  it('rejects issuing for an unknown tenant', async () => {
    const { svc } = build();
    await expect(
      svc.issue(admin(), 'nope', { name: 'X', scopes: LOYALTY }, 'corr'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ABAC: a tenant-scoped operator cannot issue credentials for another tenant', async () => {
    const { svc } = build();
    const scoped = admin({ tenants: ['t2'] });
    await expect(
      svc.issue(scoped, 't1', { name: 'X', scopes: LOYALTY }, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('audits issuance with the granted scopes, flagging sensitive ones', async () => {
    const { svc, audit } = build();
    await svc.issue(
      admin(),
      't1',
      { name: 'PayKH', scopes: [...LOYALTY, 'treasury.approve'], ownerEmail: 'ops@paykh.dev' },
      'corr',
    );
    const entry = audit.record.mock.calls.find((c) => c[0].action === 'api_client.issued');
    expect(entry?.[0].metadata.sensitiveScopes).toEqual(['treasury.approve']);
    expect(entry?.[0].actor).toBe('ops@paychain.dev');
  });
});

describe('AdminClientsService — sensitive scopes need an accountable owner (§30)', () => {
  // Without a named human behind the credential, maker-checker cannot be enforced when an admin
  // later approves what it requested — TreasuryService.adminApprove would fail closed mid-approval
  // on a real movement, which is the worst possible moment to discover it.
  it('REFUSES a sensitive scope with no ownerEmail', async () => {
    const { svc } = build();
    await expect(
      svc.issue(admin(), 't1', { name: 'X', scopes: ['treasury.manage'] }, 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('names the offending scopes so the operator knows what to do', async () => {
    const { svc } = build();
    await expect(
      svc.issue(admin(), 't1', { name: 'X', scopes: [...LOYALTY, 'treasury.approve'] }, 'corr'),
    ).rejects.toThrow(/treasury\.approve/);
  });

  it('ALLOWS a sensitive scope when an owner is recorded', async () => {
    const { svc, prisma } = build();
    const issued = await svc.issue(
      admin(), 't1', { name: 'X', scopes: ['treasury.manage'], ownerEmail: 'Ops@PayKH.dev' }, 'corr',
    );
    // Normalized, so the later comparison against an admin email is case-insensitive by storage.
    expect(prisma.clients[issued.id]!.ownerEmail).toBe('ops@paykh.dev');
  });

  it('does NOT require an owner for ordinary loyalty scopes', async () => {
    const { svc } = build();
    await expect(svc.issue(admin(), 't1', { name: 'X', scopes: LOYALTY }, 'corr')).resolves.toBeDefined();
  });

  it('REFUSES adding a sensitive scope later to an unowned credential', async () => {
    const { svc } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'X', scopes: LOYALTY }, 'corr');
    await expect(
      svc.updateScopes(admin(), issued.id, [...LOYALTY, 'treasury.manage'], 'corr'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AdminClientsService — rotation and revocation', () => {
  it('rotation invalidates the old secret and issues a working new one', async () => {
    const { svc, prisma } = build();
    const first = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');
    const rotated = await svc.rotateSecret(admin(), first.id, 'corr');

    expect(rotated.clientSecret).not.toBe(first.clientSecret);
    expect(rotated.clientId).toBe(first.clientId); // stable id — partner changes one env var

    const hash = String(prisma.clients[first.id]!.clientSecretHash);
    expect(verifyClientSecret(rotated.clientSecret, hash).ok).toBe(true);
    expect(verifyClientSecret(first.clientSecret, hash).ok).toBe(false); // old one is dead
  });

  it('revokes a client and audits it', async () => {
    const { svc, audit } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');
    const revoked = await svc.setStatus(admin(), issued.id, 'REVOKED', 'corr');
    expect(revoked.status).toBe('REVOKED');
    expect(audit.record.mock.calls.some((c) => c[0].action === 'api_client.revoked')).toBe(true);
  });

  it('ABAC: cannot rotate a credential belonging to another tenant', async () => {
    const { svc } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');
    await expect(
      svc.rotateSecret(admin({ tenants: ['t2'] }), issued.id, 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('records what changed when scopes are edited', async () => {
    const { svc, audit } = build();
    const issued = await svc.issue(admin(), 't1', { name: 'PayKH', scopes: LOYALTY }, 'corr');
    await svc.updateScopes(admin(), issued.id, ['wallet.read', 'transaction.read'], 'corr');

    const entry = audit.record.mock.calls.find((c) => c[0].action === 'api_client.scopes_changed');
    expect(entry?.[0].metadata.added).toEqual(['transaction.read']);
    expect(entry?.[0].metadata.removed).toEqual(expect.arrayContaining(['wallet.write', 'asset.issue']));
  });
});
