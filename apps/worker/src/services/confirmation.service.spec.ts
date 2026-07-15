import { ConfirmationService } from './confirmation.service';

describe('ConfirmationService', () => {
  function build(chainStatus: string, update: jest.Mock) {
    const prisma = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([{ id: 'tx1', blockchainHash: 'HASH' }]),
        update,
      },
    } as never;
    const chain = {
      getTransaction: jest.fn().mockResolvedValue({ transactionHash: 'HASH', status: chainStatus }),
    } as never;
    return new ConfirmationService(prisma, chain);
  }

  it('advances a chain-confirmed tx to CONFIRMED', async () => {
    const update = jest.fn().mockResolvedValue({});
    const res = await build('confirmed', update).processPending();
    expect(res.confirmed).toBe(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED' }) }),
    );
  });

  it('marks a chain-failed tx FAILED', async () => {
    const update = jest.fn().mockResolvedValue({});
    const res = await build('failed', update).processPending();
    expect(res.failed).toBe(1);
  });

  it('leaves an unknown tx untouched (submission != confirmation)', async () => {
    const update = jest.fn();
    const res = await build('not_found', update).processPending();
    expect(res.confirmed).toBe(0);
    expect(res.failed).toBe(0);
    expect(update).not.toHaveBeenCalled();
  });
});
