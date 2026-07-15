import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthContext } from '../auth/auth-context';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(auth: AuthContext, id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.tenantId !== auth.tenantId) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async list(auth: AuthContext, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }
}
