import { Body, Controller, Get, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { loadConfig } from '@paychain/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Mock Bakong API (§31 "bank reserves").
 *
 * Serves the shape a real bank balance endpoint serves, so the reserve verification path can be
 * built, tested and demonstrated before any Bakong connection exists. Replaced by the real API;
 * the response shape is what HttpBankBalanceProvider expects, so that swap is a binding change.
 *
 * Every response is stamped `"simulated": true` and `"provider": "sandbox-bakong-mock"`. That is
 * not decoration. A screenshot of this endpoint must not be mistakable for evidence of real
 * money, and the field is the difference between a demo and a misrepresentation.
 *
 * Refuses to load outside testnet/futurenet — see SandboxModule.
 */
@Controller('sandbox/bakong')
// Authenticated even though it is a mock. These endpoints let a caller state what "the bank"
// says; unauthenticated, anyone on the internet could author the figure that PayChain's reserve
// verification is checked against, which would make the check worse than not having one.
@UseGuards(JwtAuthGuard)
export class SandboxBankController {
  constructor(private readonly prisma: PrismaService) {}

  private stamp<T extends object>(body: T): T & { simulated: true; provider: string } {
    return { ...body, simulated: true, provider: 'sandbox-bakong-mock' };
  }

  /** GET balance — the endpoint the reserve verifier calls. */
  @Get('accounts/:accountNumber/balance')
  async balance(@Param('accountNumber') accountNumber: string) {
    const row = await this.prisma.sandboxBankAccount.findUnique({ where: { accountNumber } });
    if (!row) throw new NotFoundException(`No sandbox bank account ${accountNumber}`);
    return this.stamp({
      accountNumber: row.accountNumber,
      accountName: row.accountName,
      currency: row.currency,
      balance: row.balance,
      asOf: row.updatedAt.toISOString(),
    });
  }

  /** Creates or replaces a sandbox account. This is how a demo sets up "the bank's" position. */
  @Put('accounts/:accountNumber')
  async upsert(
    @Param('accountNumber') accountNumber: string,
    @Body() body: { accountName?: string; currency?: string; balance?: string },
  ) {
    const row = await this.prisma.sandboxBankAccount.upsert({
      where: { accountNumber },
      update: {
        accountName: body.accountName,
        currency: body.currency,
        balance: body.balance,
      },
      create: {
        accountNumber,
        accountName: body.accountName ?? `Sandbox account ${accountNumber}`,
        currency: body.currency ?? 'KHR',
        balance: body.balance ?? '0',
      },
    });
    return this.stamp({ accountNumber: row.accountNumber, balance: row.balance });
  }

  /**
   * Moves the bank's figure without touching PayChain's books.
   *
   * This is the interesting one for a regulator demo: it creates a genuine disagreement between
   * what the bank says and what our reserve ledger claims, so the drift detection can be shown
   * catching something real rather than asserted to work.
   */
  @Post('accounts/:accountNumber/simulate-movement')
  async simulate(
    @Param('accountNumber') accountNumber: string,
    @Body() body: { balance: string },
  ) {
    const row = await this.prisma.sandboxBankAccount.update({
      where: { accountNumber },
      data: { balance: body.balance },
    });
    return this.stamp({ accountNumber: row.accountNumber, balance: row.balance });
  }
}

/** True only on the sandbox networks. Used to keep this controller out of anything else. */
export function sandboxEnabled(): boolean {
  const net = loadConfig().STELLAR_NETWORK;
  return net === 'testnet' || net === 'futurenet';
}
