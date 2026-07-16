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

  it('allows approval by a different checker and executes', async () => {
    const update = jest.fn().mockResolvedValue({ ...movement, status: 'EXECUTED', approvedBy: 'checker' });
    const svc = build(update);
    const res = await svc.approve({ tenantId: 't1', clientId: 'checker', scopes: [] }, 'tm1', 'corr');
    expect(res.status).toBe('EXECUTED');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ approvedBy: 'checker', status: 'EXECUTED' }) }),
    );
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
