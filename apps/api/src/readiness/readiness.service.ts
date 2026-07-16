import { ForbiddenException, Injectable, NotFoundException, type OnModuleInit } from '@nestjs/common';
import type { ReadinessGate, ReadinessStatus } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { READINESS_GATES } from './readiness.constants';

const READY_STATES: ReadinessStatus[] = ['PASSED', 'WAIVED'];

export interface ReadinessSummary {
  total: number;
  passed: number;
  mandatoryTotal: number;
  mandatoryPassed: number;
  productionReady: boolean;
  blockedBy: string[];
}

/**
 * Production-readiness gate system (§43, §35). Evidence-based, not an arbitrary confidence
 * number. `assertProductionReady` is the hard block: production / mainnet activation cannot
 * proceed while any mandatory gate is not PASSED (or WAIVED with a reason).
 */
@Injectable()
export class ReadinessService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Seeds gates once (create-only) so operator-set statuses are never overwritten on boot. */
  async onModuleInit(): Promise<void> {
    try {
      await this.seed();
    } catch {
      // DB not reachable at boot (e.g. during build). Seeding retries lazily via ensureSeeded.
    }
  }

  async seed(): Promise<void> {
    for (const g of READINESS_GATES) {
      await this.prisma.readinessGate.upsert({
        where: { key: g.key },
        create: {
          key: g.key,
          category: g.category,
          title: g.title,
          mandatory: g.mandatory,
          status: g.initialStatus,
          evidence: g.evidence,
        },
        // Only keep metadata in sync; never clobber an operator-updated status/evidence.
        update: { category: g.category, title: g.title, mandatory: g.mandatory },
      });
    }
  }

  async list(): Promise<ReadinessGate[]> {
    await this.ensureSeeded();
    return this.prisma.readinessGate.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] });
  }

  async summary(): Promise<ReadinessSummary> {
    const gates = await this.list();
    const mandatory = gates.filter((g) => g.mandatory);
    const blockedBy = mandatory.filter((g) => !READY_STATES.includes(g.status)).map((g) => g.key);
    return {
      total: gates.length,
      passed: gates.filter((g) => READY_STATES.includes(g.status)).length,
      mandatoryTotal: mandatory.length,
      mandatoryPassed: mandatory.length - blockedBy.length,
      productionReady: blockedBy.length === 0,
      blockedBy,
    };
  }

  async setGate(
    actor: string,
    key: string,
    input: { status: ReadinessStatus; evidence?: string; notes?: string },
    correlationId: string,
  ): Promise<ReadinessGate> {
    const gate = await this.prisma.readinessGate.findUnique({ where: { key } });
    if (!gate) throw new NotFoundException(`Readiness gate "${key}" not found`);
    const updated = await this.prisma.readinessGate.update({
      where: { key },
      data: {
        status: input.status,
        evidence: input.evidence ?? gate.evidence,
        notes: input.notes ?? gate.notes,
        verifiedBy: actor,
        verifiedAt: new Date(),
      },
    });
    await this.audit.record({
      actor,
      action: 'readiness.gate.update',
      resourceType: 'readiness_gate',
      resourceId: key,
      correlationId,
      metadata: { status: input.status, from: gate.status },
    });
    return updated;
  }

  /** Hard gate: throws unless every mandatory gate is satisfied (§43, §0.2). */
  async assertProductionReady(): Promise<void> {
    const s = await this.summary();
    if (!s.productionReady) {
      throw new ForbiddenException(
        `Production activation is blocked. Failing mandatory gates: ${s.blockedBy.join(', ')}`,
      );
    }
  }

  private async ensureSeeded(): Promise<void> {
    const count = await this.prisma.readinessGate.count();
    if (count === 0) await this.seed();
  }
}
