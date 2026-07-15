import { ForbiddenException } from '@nestjs/common';
import { ReadinessService } from './readiness.service';

/**
 * M6 exit gate (§43, §0.2): production activation stays blocked until ALL mandatory gates
 * are PASSED (or WAIVED). The summary lists exactly what is blocking.
 */
describe('ReadinessService', () => {
  function build(gates: Array<{ mandatory: boolean; status: string; key: string }>) {
    const prisma = {
      readinessGate: {
        count: jest.fn().mockResolvedValue(gates.length),
        findMany: jest.fn().mockResolvedValue(gates),
      },
    } as never;
    return new ReadinessService(prisma, { record: jest.fn() } as never);
  }

  it('is not production-ready while a mandatory gate is unmet, and lists blockers', async () => {
    const svc = build([
      { key: 'a', mandatory: true, status: 'PASSED' },
      { key: 'b', mandatory: true, status: 'PENDING' },
      { key: 'c', mandatory: true, status: 'BLOCKED' },
      { key: 'd', mandatory: false, status: 'PENDING' }, // non-mandatory doesn't block
    ]);
    const s = await svc.summary();
    expect(s.productionReady).toBe(false);
    expect(s.blockedBy).toEqual(['b', 'c']);
    await expect(svc.assertProductionReady()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('is production-ready only when every mandatory gate is PASSED or WAIVED', async () => {
    const svc = build([
      { key: 'a', mandatory: true, status: 'PASSED' },
      { key: 'b', mandatory: true, status: 'WAIVED' },
      { key: 'c', mandatory: false, status: 'PENDING' },
    ]);
    const s = await svc.summary();
    expect(s.productionReady).toBe(true);
    expect(s.blockedBy).toEqual([]);
    await expect(svc.assertProductionReady()).resolves.toBeUndefined();
  });
});
