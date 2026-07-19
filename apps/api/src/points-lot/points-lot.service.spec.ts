import { PointsLotService } from './points-lot.service';

interface Lot {
  id: string;
  remaining: string;
  status: string;
  expiresAt: number | null;
  earnedAt: number;
}

function fakePrisma(lots: Lot[], opts: { throwOnFind?: boolean } = {}) {
  const store = lots.map((l) => ({ ...l }));
  return {
    store,
    pointsLot: {
      findMany: async ({ orderBy }: { orderBy?: unknown } = {}) => {
        if (opts.throwOnFind) throw new Error('db down');
        void orderBy;
        // ACTIVE only, soonest-expiring first (nulls last), then oldest earn — mirrors the service's orderBy.
        return store
          .filter((l) => l.status === 'ACTIVE')
          .slice()
          .sort((a, b) => {
            if (a.expiresAt === null && b.expiresAt === null) return a.earnedAt - b.earnedAt;
            if (a.expiresAt === null) return 1;
            if (b.expiresAt === null) return -1;
            if (a.expiresAt !== b.expiresAt) return a.expiresAt - b.expiresAt;
            return a.earnedAt - b.earnedAt;
          });
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const l = store.find((x) => x.id === where.id)!;
        Object.assign(l, data);
        return l;
      },
    },
  };
}

const svc = (prisma: ReturnType<typeof fakePrisma>) => new PointsLotService(prisma as never);
const byId = (prisma: ReturnType<typeof fakePrisma>, id: string) => prisma.store.find((l) => l.id === id)!;

describe('PointsLotService.consume', () => {
  it('draws down FIFO by expiry (soonest-expiring first) and marks a depleted lot CONSUMED', async () => {
    const prisma = fakePrisma([
      { id: 'a', remaining: '50', status: 'ACTIVE', expiresAt: 200, earnedAt: 1 },
      { id: 'b', remaining: '50', status: 'ACTIVE', expiresAt: 100, earnedAt: 2 }, // expires sooner
    ]);
    await svc(prisma).consume('t', 'w', 'asset', '60');
    // b (soonest expiry) fully consumed first, then 10 from a.
    expect(byId(prisma, 'b')).toMatchObject({ remaining: '0', status: 'CONSUMED' });
    expect(byId(prisma, 'a')).toMatchObject({ remaining: '40', status: 'ACTIVE' });
  });

  it('consumes expiring lots before non-expiring ones', async () => {
    const prisma = fakePrisma([
      { id: 'x', remaining: '30', status: 'ACTIVE', expiresAt: null, earnedAt: 1 }, // never expires
      { id: 'y', remaining: '30', status: 'ACTIVE', expiresAt: 500, earnedAt: 2 },
    ]);
    await svc(prisma).consume('t', 'w', 'asset', '40');
    expect(byId(prisma, 'y')).toMatchObject({ remaining: '0', status: 'CONSUMED' });
    expect(byId(prisma, 'x')).toMatchObject({ remaining: '20', status: 'ACTIVE' }); // drawn last
  });

  it('is exact fixed-point (no float drift on fractional amounts)', async () => {
    const prisma = fakePrisma([{ id: 'a', remaining: '0.3', status: 'ACTIVE', expiresAt: 1, earnedAt: 1 }]);
    await svc(prisma).consume('t', 'w', 'asset', '0.1');
    expect(byId(prisma, 'a').remaining).toBe('0.2');
  });

  it('no-ops on a zero/negative amount (no lot touched)', async () => {
    const prisma = fakePrisma([{ id: 'a', remaining: '50', status: 'ACTIVE', expiresAt: 1, earnedAt: 1 }]);
    await svc(prisma).consume('t', 'w', 'asset', '0');
    expect(byId(prisma, 'a').remaining).toBe('50');
  });

  it('consumes all it can when the burn exceeds lotted points, without throwing', async () => {
    const prisma = fakePrisma([{ id: 'a', remaining: '10', status: 'ACTIVE', expiresAt: 1, earnedAt: 1 }]);
    await expect(svc(prisma).consume('t', 'w', 'asset', '25')).resolves.toBeUndefined();
    expect(byId(prisma, 'a')).toMatchObject({ remaining: '0', status: 'CONSUMED' });
  });

  it('is best-effort: a DB failure never throws to the caller (the burn already happened on chain)', async () => {
    const prisma = fakePrisma([], { throwOnFind: true });
    await expect(svc(prisma).consume('t', 'w', 'asset', '10')).resolves.toBeUndefined();
  });
});
