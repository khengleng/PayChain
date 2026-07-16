import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STABLECOIN_FLAGS, GLOBAL_TENANT } from '../feature-flags/feature-flags.constants';

/**
 * Cross-tenant, read-only admin views (§37). Every method here backs a permission-gated
 * admin-portal screen and reads across all tenants (the human admin is authorized by RBAC,
 * not by tenant scope). These are deliberately read-only: privileged writes (freeze, flag
 * toggle, treasury approval, …) already live in their own maker-checker-gated endpoints.
 *
 * All list methods cap results — an admin screen shows the most recent slice, never an
 * unbounded dump.
 */
const MAX = 200;

@Injectable()
export class AdminReadService {
  constructor(private readonly prisma: PrismaService) {}

  /** tenantId → tenant name, for enriching models that store only a tenantId string. */
  private async tenantNames(): Promise<Map<string, string>> {
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
    return new Map(tenants.map((t) => [t.id, t.name]));
  }

  async tenants() {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { _count: { select: { apiClients: true, wallets: true, assets: true } } },
    });
    return {
      items: rows.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        apiClients: t._count.apiClients,
        wallets: t._count.wallets,
        assets: t._count.assets,
        createdAt: t.createdAt,
      })),
    };
  }

  async wallets(query?: string) {
    const q = query?.trim() || undefined;
    const where = q
      ? {
          OR: [
            { ownerReference: { contains: q, mode: 'insensitive' as const } },
            { stellarAccountId: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const rows = await this.prisma.wallet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { tenant: { select: { name: true } } },
    });
    return {
      query: q ?? null,
      items: rows.map((w) => ({
        id: w.id,
        tenant: w.tenant.name,
        ownerType: w.ownerType,
        ownerReference: w.ownerReference,
        stellarAccountId: w.stellarAccountId,
        status: w.status,
        verificationStatus: w.verificationStatus,
        riskLevel: w.riskLevel,
        createdAt: w.createdAt,
        lastActivityAt: w.lastActivityAt,
      })),
    };
  }

  async assets() {
    const rows = await this.prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { tenant: { select: { name: true } } },
    });
    return {
      items: rows.map((a) => ({
        id: a.id,
        tenant: a.tenant.name,
        assetCode: a.assetCode,
        assetName: a.assetName,
        assetType: a.assetType,
        status: a.status,
        transferability: a.transferability,
        redeemability: a.redeemability,
        expiryPolicy: a.expiryPolicy,
        createdAt: a.createdAt,
      })),
    };
  }

  async stablecoins() {
    const rows = await this.prisma.stablecoinConfig.findMany({
      orderBy: { createdAt: 'desc' },
      take: MAX,
      include: { asset: { select: { assetCode: true, assetName: true } } },
    });
    return {
      items: rows.map((s) => ({
        id: s.id,
        assetCode: s.asset.assetCode,
        assetName: s.asset.assetName,
        classification: s.classification,
        referenceCurrency: s.referenceCurrency,
        lifecycleState: s.lifecycleState,
        activationStatus: s.activationStatus,
        reserveRatioTarget: s.reserveRatioTarget,
        redemptionEnabled: s.redemptionEnabled,
        jurisdiction: s.jurisdiction,
        createdAt: s.createdAt,
      })),
    };
  }

  async reserve() {
    const [accounts, tenants] = await Promise.all([
      this.prisma.reserveAccount.findMany({ orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: accounts.map((r) => ({
        id: r.id,
        tenant: tenants.get(r.tenantId) ?? r.tenantId,
        assetId: r.assetId,
        label: r.label,
        custodianReference: r.custodianReference,
        bankReference: r.bankReference,
        balance: r.balance,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  async treasury() {
    const [movements, tenants] = await Promise.all([
      this.prisma.treasuryMovement.findMany({ orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: movements.map((m) => ({
        id: m.id,
        tenant: tenants.get(m.tenantId) ?? m.tenantId,
        fromAccount: m.fromAccount,
        toAccount: m.toAccount,
        amount: m.amount,
        purpose: m.purpose,
        status: m.status,
        createdBy: m.createdBy,
        approvedBy: m.approvedBy,
        executedAt: m.executedAt,
        createdAt: m.createdAt,
      })),
    };
  }

  async complianceAlerts() {
    const [alerts, tenants] = await Promise.all([
      this.prisma.monitoringAlert.findMany({ orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: alerts.map((a) => ({
        id: a.id,
        tenant: tenants.get(a.tenantId) ?? a.tenantId,
        ruleKey: a.ruleKey,
        severity: a.severity,
        status: a.status,
        subjectType: a.subjectType,
        subjectReference: a.subjectReference,
        reason: a.reason,
        holdApplied: a.holdApplied,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
      })),
    };
  }

  async reconciliation() {
    const [exceptions, tenants] = await Promise.all([
      this.prisma.reconciliationException.findMany({ orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: exceptions.map((e) => ({
        id: e.id,
        tenant: tenants.get(e.tenantId) ?? e.tenantId,
        category: e.category,
        status: e.status,
        transactionId: e.transactionId,
        blockchainHash: e.blockchainHash,
        correlationId: e.correlationId,
        createdAt: e.createdAt,
        resolvedAt: e.resolvedAt,
        resolvedBy: e.resolvedBy,
      })),
    };
  }

  /**
   * Feature flags for the GLOBAL scope, plus any tenant overrides. Every declared
   * stablecoin.* flag is shown even without a DB row — its effective value is then OFF,
   * making the "all production flags default OFF" invariant visible (§36).
   */
  async flags() {
    const [rows, tenants] = await Promise.all([
      this.prisma.featureFlag.findMany({ orderBy: [{ key: 'asc' }, { tenantId: 'asc' }] }),
      this.tenantNames(),
    ]);
    const globalByKey = new Map(
      rows.filter((r) => r.tenantId === GLOBAL_TENANT).map((r) => [r.key, r]),
    );
    const global: Array<{
      key: string;
      enabled: boolean;
      seeded: boolean;
      updatedBy: string | null;
      updatedAt: Date | null;
    }> = STABLECOIN_FLAGS.map((key) => {
      const row = globalByKey.get(key);
      return {
        key,
        enabled: row?.enabled ?? false,
        seeded: !!row,
        updatedBy: row?.updatedBy ?? null,
        updatedAt: row?.updatedAt ?? null,
      };
    });
    // Surface any non-declared global flags that exist in the DB too.
    for (const row of rows) {
      if (row.tenantId === GLOBAL_TENANT && !STABLECOIN_FLAGS.includes(row.key as never)) {
        global.push({ key: row.key, enabled: row.enabled, seeded: true, updatedBy: row.updatedBy, updatedAt: row.updatedAt });
      }
    }
    const overrides = rows
      .filter((r) => r.tenantId !== GLOBAL_TENANT)
      .map((r) => ({
        tenantId: r.tenantId,
        tenant: tenants.get(r.tenantId) ?? r.tenantId,
        key: r.key,
        enabled: r.enabled,
        updatedBy: r.updatedBy,
        updatedAt: r.updatedAt,
      }));
    return { global, overrides };
  }

  async audit() {
    const [logs, tenants] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: MAX }),
      this.tenantNames(),
    ]);
    return {
      items: logs.map((l) => ({
        id: l.id,
        tenant: l.tenantId ? (tenants.get(l.tenantId) ?? l.tenantId) : null,
        actor: l.actor,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        correlationId: l.correlationId,
        createdAt: l.createdAt,
      })),
    };
  }
}
