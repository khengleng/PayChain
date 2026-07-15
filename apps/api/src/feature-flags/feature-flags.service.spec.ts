import { FeatureFlagsService } from './feature-flags.service';
import { STABLECOIN_FLAGS } from './feature-flags.constants';

/**
 * M3 exit gate (§36): every stablecoin production flag is OFF by default when nothing is
 * seeded, and a tenant override wins over the global default.
 */
describe('FeatureFlagsService', () => {
  function build(findUnique: jest.Mock): FeatureFlagsService {
    const prisma = { featureFlag: { findUnique } } as never;
    return new FeatureFlagsService(prisma);
  }

  it('defaults every stablecoin.* flag to OFF when unseeded', async () => {
    const svc = build(jest.fn().mockResolvedValue(null));
    for (const key of STABLECOIN_FLAGS) {
      expect(await svc.isEnabled(key, 'tenant-1')).toBe(false);
    }
  });

  it('requireEnabled throws when a flag is off', async () => {
    const svc = build(jest.fn().mockResolvedValue(null));
    await expect(svc.requireEnabled('stablecoin.module.enabled', 't1')).rejects.toThrow();
  });

  it('honors a tenant override over the global default', async () => {
    // tenant override enabled=true (first lookup), global would be false.
    const findUnique = jest.fn().mockResolvedValueOnce({ enabled: true });
    const svc = build(findUnique);
    expect(await svc.isEnabled('stablecoin.creation.enabled', 'tenant-1')).toBe(true);
  });
});
