import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const BANK_BALANCE_PROVIDER = Symbol('BANK_BALANCE_PROVIDER');

export interface BankAccountBalance {
  accountNumber: string;
  accountName: string;
  currency: string;
  balance: string;
  /** When the BANK last updated this figure — not when we asked. */
  asOf: Date;
  /** Which implementation answered. Never let a caller assume this was a real bank. */
  provider: string;
}

/**
 * Reads the balance a bank reports for an account (§31 "bank reserves").
 *
 * The reserve leg of every ratio in this platform is currently a number an operator typed into
 * ReserveAccount.balance. The supply leg is derived from chain-confirmed mints and is real, so
 * "100% backed" is an exact computation over one real input and one asserted one. This interface
 * exists to make the asserted side corroborable.
 *
 * Implementations must never hold banking credentials in PayChain (§23). The real one will hold
 * an API key for a read-only balance endpoint; it must never be able to MOVE money.
 */
export interface BankBalanceProvider {
  readonly name: string;
  getBalance(accountNumber: string): Promise<BankAccountBalance | null>;
}

/**
 * Sandbox stand-in for Bakong, backed by SandboxBankAccount.
 *
 * Independent of ReserveAccount on purpose: if this echoed our own books back, reserve
 * verification could never find a discrepancy and would be a green light that means nothing.
 * Here, a mistyped reserve balance is genuinely caught.
 *
 * What this does NOT do, and must not be presented as doing: prove that money exists. It proves
 * the verification PATH works. Swapping in the real Bakong client is what makes the answer mean
 * something.
 */
@Injectable()
export class SandboxBankBalanceProvider implements BankBalanceProvider {
  readonly name = 'sandbox-bakong-mock';

  constructor(private readonly prisma: PrismaService) {}

  async getBalance(accountNumber: string): Promise<BankAccountBalance | null> {
    const row = await this.prisma.sandboxBankAccount.findUnique({ where: { accountNumber } });
    if (!row) return null;
    return {
      accountNumber: row.accountNumber,
      accountName: row.accountName,
      currency: row.currency,
      balance: row.balance,
      asOf: row.updatedAt,
      provider: this.name,
    };
  }
}

/**
 * Shape of the real client: a read-only HTTP balance lookup.
 *
 * Not wired — no Bakong credentials exist, and an account number is not API access. It is here
 * so the swap is a provider binding rather than a redesign, and so the sandbox provider above
 * is visibly a stand-in for something specific rather than a permanent fixture.
 */
export class HttpBankBalanceProvider implements BankBalanceProvider {
  readonly name = 'bakong';

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async getBalance(accountNumber: string): Promise<BankAccountBalance | null> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/accounts/${encodeURIComponent(accountNumber)}/balance`,
      { headers: { authorization: `Bearer ${this.apiKey}` } },
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      // Surface the failure. A balance lookup that fails must never be reported as a balance,
      // and must never quietly become zero.
      throw new Error(`Bank balance lookup failed: ${res.status}`);
    }
    const body = (await res.json()) as {
      accountNumber: string;
      accountName: string;
      currency: string;
      balance: string;
      asOf: string;
    };
    return {
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      currency: body.currency,
      balance: body.balance,
      asOf: new Date(body.asOf),
      provider: this.name,
    };
  }
}
