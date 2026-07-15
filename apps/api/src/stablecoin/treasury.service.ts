import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { TreasuryMovement } from '@paychain/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { assertValidAmount } from '../common/money';
import type { AuthContext } from '../auth/auth-context';

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

  private async load(tenantId: string, id: string): Promise<TreasuryMovement> {
    const movement = await this.prisma.treasuryMovement.findUnique({ where: { id } });
    if (!movement || movement.tenantId !== tenantId) throw new NotFoundException('Treasury movement not found');
    return movement;
  }
}
