import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { TreasuryMovement } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertValidAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';
import type { AdminContext } from '../admin-auth/admin-context';
import { assertPermittedByAttributes } from '../admin-auth/abac';

/**
 * Treasury module (§30). Every treasury movement is maker-checker gated: the same user may
 * not create AND approve a movement. Approval executes the (internal) movement and records
 * an audit trail.
 */
@Injectable()
export class TreasuryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    auth: AuthContext,
    input: { assetId?: string; fromAccount: string; toAccount: string; amount: string; purpose: string },
    correlationId: string,
  ): Promise<TreasuryMovement> {
    assertValidAmount(input.amount);
    const movement = await this.prisma.treasuryMovement.create({
      data: {
        tenantId: auth.tenantId,
        assetId: input.assetId,
        fromAccount: input.fromAccount,
        toAccount: input.toAccount,
        amount: input.amount,
        purpose: input.purpose,
        status: 'PENDING_APPROVAL',
        createdBy: auth.clientId,
        correlationId,
      },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'treasury.movement.create',
      resourceType: 'treasury_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { amount: input.amount, purpose: input.purpose },
    });
    return movement;
  }

  async approve(auth: AuthContext, id: string, correlationId: string): Promise<TreasuryMovement> {
    const movement = await this.load(auth.tenantId, id);
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Movement is not awaiting approval (status=${movement.status})`);
    }
    // Separation of duties (§30): the maker cannot be the checker.
    if (movement.createdBy === auth.clientId) {
      throw new ForbiddenException('The creator of a treasury movement cannot approve it');
    }
    const updated = await this.prisma.treasuryMovement.update({
      where: { id: movement.id },
      data: { status: 'EXECUTED', approvedBy: auth.clientId, executedAt: new Date() },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'treasury.movement.approve',
      resourceType: 'treasury_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { maker: movement.createdBy, amount: movement.amount },
    });
    return updated;
  }

  async reject(auth: AuthContext, id: string, correlationId: string): Promise<TreasuryMovement> {
    const movement = await this.load(auth.tenantId, id);

    // Both guards were missing here while approve had them. Without the status check an
    // already-EXECUTED movement could be overwritten to REJECTED — money moved, record says it
    // was refused, and the audit narrative contradicts the ledger.
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Movement is not awaiting approval (status=${movement.status})`);
    }
    // Rejection is a decision too: the maker must not be able to quietly bury their own request.
    if (movement.createdBy === auth.clientId) {
      throw new ForbiddenException('The creator of a treasury movement cannot reject it');
    }

    const updated = await this.prisma.treasuryMovement.update({
      where: { id: movement.id },
      data: { status: 'REJECTED', approvedBy: auth.clientId },
    });
    await this.audit.record({
      tenantId: auth.tenantId,
      actor: auth.clientId,
      action: 'treasury.movement.reject',
      resourceType: 'treasury_movement',
      resourceId: movement.id,
      correlationId,
    });
    return updated;
  }

  async list(auth: AuthContext): Promise<TreasuryMovement[]> {
    return this.prisma.treasuryMovement.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Resolves the human accountable for whoever created a movement (§30).
   *
   * `createdBy` is an API clientId; an approving admin is an email. Comparing them directly — as
   * this service used to — can never match, so the maker-checker check never fired and the code
   * asserted separation held "by construction". It did not: one person holding both an API
   * credential and portal access could create and execute a movement unopposed.
   *
   * Resolving the credential's accountable owner gives the check something real to compare.
   */
  private async makerIdentity(createdBy: string | null): Promise<string | null> {
    if (!createdBy) return null;
    const client = await this.prisma.apiClient.findUnique({
      where: { clientId: createdBy },
      select: { ownerEmail: true },
    });
    return client?.ownerEmail ?? null;
  }

  /**
   * Human-admin approval from the admin portal (§30, §37). Separation of duties is enforced
   * against the credential's accountable owner, not asserted from the namespace difference.
   * Fails closed: if we cannot establish who is behind the requesting credential, we cannot show
   * that two people were involved, so we refuse rather than approve on an assumption.
   */
  async adminApprove(admin: AdminContext, id: string, correlationId: string): Promise<TreasuryMovement> {
    const movement = await this.loadForAdmin(admin, id);
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Movement is not awaiting approval (status=${movement.status})`);
    }

    const maker = await this.makerIdentity(movement.createdBy);
    if (!maker) {
      throw new ForbiddenException(
        `Cannot verify separation of duties: the credential "${movement.createdBy}" has no ` +
          `accountable owner recorded, so we cannot show the approver is a different person. ` +
          `Set an owner on that API client, then approve.`,
      );
    }
    if (maker.toLowerCase() === admin.email.toLowerCase()) {
      throw new ForbiddenException(
        'Maker-checker: you are the accountable owner of the credential that requested this ' +
          'movement, so you cannot approve it. A second person must.',
      );
    }
    const updated = await this.prisma.treasuryMovement.update({
      where: { id: movement.id },
      data: { status: 'EXECUTED', approvedBy: admin.email, executedAt: new Date() },
    });
    await this.audit.record({
      tenantId: movement.tenantId,
      actor: admin.email,
      action: 'treasury.movement.approve',
      resourceType: 'treasury_movement',
      resourceId: movement.id,
      correlationId,
      metadata: {
        maker: movement.createdBy,
        makerOwner: maker,
        amount: movement.amount,
        via: 'admin-portal',
      },
    });
    return updated;
  }

  async adminReject(admin: AdminContext, id: string, correlationId: string): Promise<TreasuryMovement> {
    const movement = await this.loadForAdmin(admin, id);
    if (movement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Movement is not awaiting approval (status=${movement.status})`);
    }
    const updated = await this.prisma.treasuryMovement.update({
      where: { id: movement.id },
      data: { status: 'REJECTED', approvedBy: admin.email },
    });
    await this.audit.record({
      tenantId: movement.tenantId,
      actor: admin.email,
      action: 'treasury.movement.reject',
      resourceType: 'treasury_movement',
      resourceId: movement.id,
      correlationId,
      metadata: { maker: movement.createdBy, via: 'admin-portal' },
    });
    return updated;
  }

  private async load(tenantId: string, id: string): Promise<TreasuryMovement> {
    const movement = await this.prisma.treasuryMovement.findUnique({ where: { id } });
    if (!movement || movement.tenantId !== tenantId) throw new NotFoundException('Treasury movement not found');
    return movement;
  }

  private async loadForAdmin(admin: AdminContext, id: string): Promise<TreasuryMovement> {
    const movement = await this.prisma.treasuryMovement.findUnique({ where: { id } });
    if (!movement) throw new NotFoundException('Treasury movement not found');
    assertPermittedByAttributes(admin, { tenantId: movement.tenantId });
    return movement;
  }
}
