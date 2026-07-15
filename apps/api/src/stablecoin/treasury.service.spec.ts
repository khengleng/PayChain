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
