import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GLOBAL_TENANT } from './feature-flags.constants';

/**
 * Feature-flag resolution (§36). Precedence: tenant override → GLOBAL default → OFF.
 * The safe default is always OFF, so an unknown/unseeded flag is disabled — production
 * stablecoin capabilities can never be on by accident.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(key: string, tenantId?: string): Promise<boolean> {
    if (tenantId && tenantId !== GLOBAL_TENANT) {
      const override = await this.prisma.featureFlag.findUnique({
        where: { tenantId_key: { tenantId, key } },
      });
      if (override) return override.enabled;
    }
    const global = await this.prisma.featureFlag.findUnique({
      where: { tenantId_key: { tenantId: GLOBAL_TENANT, key } },
    });
    return global ? global.enabled : false;
  }

  async requireEnabled(key: string, tenantId?: string): Promise<void> {
    if (!(await this.isEnabled(key, tenantId))) {
      throw new ForbiddenException(`Feature "${key}" is disabled`);
    }
  }

  async set(key: string, enabled: boolean, tenantId = GLOBAL_TENANT, updatedBy?: string): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, enabled, updatedBy },
      update: { enabled, updatedBy },
    });
  }

  async list(tenantId = GLOBAL_TENANT): Promise<{ key: string; enabled: boolean }[]> {
    const rows = await this.prisma.featureFlag.findMany({ where: { tenantId } });
    return rows.map((r) => ({ key: r.key, enabled: r.enabled }));
  }
}
