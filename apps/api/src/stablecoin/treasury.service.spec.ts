import { ForbiddenException } from '@nestjs/common';
import { TreasuryService } from './treasury.service';

/** M4 exit gate (§30): the same user cannot create AND approve a treasury movement. */
describe('TreasuryService maker-checker', () => {
  const movement = {
    id: 'tm1',
    tenantId: 't1',
    status: 'PENDING_APPROVAL',
    createdBy: 'maker',
    amount: '1000',
  };

  function build(update = jest.fn()) {
    const prisma = {
      treasuryMovement: {
        findUnique: jest.fn().mockResolvedValue(movement),
        update,
      },
    } as never;
    return new TreasuryService(prisma, { record: jest.fn() } as never);
  }

  it('rejects approval by the maker', async () => {
    const svc = build();
    await expect(
      svc.approve({ tenantId: 't1', clientId: 'maker', scopes: [] }, 'tm1', 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  // This test previously asserted approve() yields EXECUTED — it encoded the bug. PayChain has
  // no bank rails, so approval authorises and nothing has settled yet. Settlement is a separate,
  // evidenced act (see the §30 suite below).
  it('allows approval by a different checker, landing in APPROVED — not EXECUTED', async () => {
    const update = jest.fn().mockResolvedValue({ ...movement, status: 'APPROVED', approvedBy: 'checker' });
    const svc = build(update);
    const res = await svc.approve({ tenantId: 't1', clientId: 'checker', scopes: [] }, 'tm1', 'corr');
    expect(res.status).toBe('APPROVED');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ approvedBy: 'checker', status: 'APPROVED' }) }),
    );
    // executedAt must NOT be stamped for a settlement that has not happened.
    expect(update.mock.calls[0]![0].data).not.toHaveProperty('executedAt');
  });
});

/**
 * The admin-portal approval path (§30, §37). The maker is an API client and the checker is a
 * human admin — different identity namespaces — so the old check `movement.createdBy ===
 * admin.email` compared a clientId to an email and could never be true. It never fired. One
 * person holding both an API credential and portal access created and executed movements
 * unopposed, while the code asserted separation held "by construction".
 *
 * Separation is now enforced against the credential's accountable owner.
 */
describe('TreasuryService — admin approval enforces real separation of duties', () => {
  const movement = {
    id: 'tm1',
    tenantId: 't1',
    status: 'PENDING_APPROVAL',
    createdBy: 'paykh_abc',
    amount: '1000',
  };

  function build(ownerEmail: string | null, update = jest.fn()) {
    const prisma = {
      treasuryMovement: {
        findUnique: jest.fn().mockResolvedValue(movement),
        update,
      },
      apiClient: {
        findUnique: jest.fn().mockResolvedValue(ownerEmail === null ? null : { ownerEmail }),
      },
    } as never;
    return new TreasuryService(prisma, { record: jest.fn() } as never);
  }

  const admin = (email: string) =>
    ({ userId: 'u1', email, role: 'TREASURY_ADMIN', permissions: [], attributes: {} }) as never;

  it('BLOCKS the insider path: the credential owner approving their own request', async () => {
    const svc = build('treasury@paychain.dev');
    await expect(
      svc.adminApprove(admin('treasury@paychain.dev'), 'tm1', 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('is case-insensitive — a different capitalisation is the same human', async () => {
    const svc = build('treasury@paychain.dev');
    await expect(
      svc.adminApprove(admin('Treasury@PayChain.dev'), 'tm1', 'corr'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ALLOWS a genuinely different person to approve', async () => {
    const update = jest.fn().mockResolvedValue({ ...movement, status: 'EXECUTED' });
    const svc = build('maker@paychain.dev', update);
    const res = await svc.adminApprove(admin('checker@paychain.dev'), 'tm1', 'corr');
    expect(res.status).toBe('EXECUTED');
  });

  // Fails closed: an unknown maker means we cannot show two people were involved. Approving on
  // that assumption is exactly what the old code did.
  it('REFUSES when the requesting credential has no accountable owner', async () => {
    const svc = build(null);
    await expect(svc.adminApprove(admin('checker@paychain.dev'), 'tm1', 'corr')).rejects.toThrow(
      /no accountable owner/i,
    );
  });
});

/**
 * §30. approve() used to set EXECUTED and stamp executedAt while moving nothing: fromAccount and
 * toAccount are free-text, there is no ledger posting, no chain op, no reserve link. It also
 * skipped the APPROVED state that already existed in the enum. PayChain has no bank rails and
 * cannot move fiat — so authorising and confirming settlement are separated, and the terminal
 * state must carry evidence.
 */
describe('TreasuryService — approval authorises; only settlement executes (§30)', () => {
  function build(status: string, extra: Record<string, unknown> = {}) {
    const movement: Record<string, unknown> = {
      id: 'tm1', tenantId: 't1', status, createdBy: 'maker', amount: '1000', ...extra,
    };
    let rec: Record<string, unknown> = { ...movement };
    const prisma = {
      treasuryMovement: {
        findUnique: jest.fn().mockImplementation(async () => ({ ...rec })),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => { rec = { ...rec, ...data }; return { ...rec }; }),
      },
      apiClient: { findUnique: jest.fn().mockResolvedValue({ ownerEmail: 'maker@paychain.dev' }) },
    } as never;
    const audit = { record: jest.fn() };
    return { svc: new TreasuryService(prisma, audit as never), audit, store: () => rec };
  }
  const as = (clientId: string) => ({ tenantId: 't1', clientId, scopes: [] });

  it('approval lands in APPROVED, not EXECUTED — nothing has settled yet', async () => {
    const { svc, store } = build('PENDING_APPROVAL');
    const r = await svc.approve(as('checker'), 'tm1', 'corr');
    expect(r.status).toBe('APPROVED');
    // The bug: executedAt was stamped for a settlement that never happened.
    expect(store().executedAt).toBeUndefined();
  });

  it('recording settlement REQUIRES an external reference — otherwise EXECUTED means nothing', async () => {
    const { svc } = build('APPROVED');
    await expect(svc.execute(as('checker'), 'tm1', '   ', 'corr')).rejects.toThrow(/external reference/i);
  });

  it('records settlement with the evidence and who attested it', async () => {
    const { svc, audit } = build('APPROVED', { approvedBy: 'checker' });
    const r = await svc.execute(as('settler'), 'tm1', 'BANK-REF-99', 'corr');
    expect(r.status).toBe('EXECUTED');
    expect(r.externalReference).toBe('BANK-REF-99');
    expect(r.executedBy).toBe('settler');
    const entry = audit.record.mock.calls.find((c) => c[0].action === 'treasury.movement.settled');
    expect(entry?.[0].metadata).toMatchObject({ externalReference: 'BANK-REF-99', maker: 'maker' });
  });

  it('REFUSES to settle a movement that was never approved', async () => {
    const { svc } = build('PENDING_APPROVAL');
    await expect(svc.execute(as('checker'), 'tm1', 'BANK-1', 'corr')).rejects.toThrow(/Only an APPROVED/);
  });

  it('REFUSES to let the maker attest their own instruction settled', async () => {
    // Otherwise request and confirmation collapse back into one person.
    const { svc } = build('APPROVED');
    await expect(svc.execute(as('maker'), 'tm1', 'BANK-1', 'corr')).rejects.toThrow(/cannot record its settlement/);
  });

  it('cannot settle twice', async () => {
    const { svc } = build('EXECUTED', { externalReference: 'BANK-1' });
    await expect(svc.execute(as('checker'), 'tm1', 'BANK-2', 'corr')).rejects.toThrow(/Only an APPROVED/);
  });
});
