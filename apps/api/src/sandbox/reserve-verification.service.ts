import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addAmounts, compareAmounts, subAmounts } from '../common/money';
import { BANK_BALANCE_PROVIDER, type BankBalanceProvider } from './bank-balance.provider';

export type VerificationStatus = 'VERIFIED' | 'DRIFT' | 'UNVERIFIABLE';

export interface AccountVerification {
  reserveAccountId: string;
  label: string;
  bankReference: string | null;
  /** What PayChain's books claim. */
  ledgerBalance: string;
  /** What the bank says, or null when we could not ask. */
  bankBalance: string | null;
  /** ledgerBalance - bankBalance. Positive means our books claim more than the bank holds. */
  difference: string | null;
  status: VerificationStatus;
  reason?: string;
  provider: string;
}

/**
 * Corroborates PayChain's reserve ledger against the bank (§31 "bank reserves").
 *
 * The reserve leg of every backing claim is a number an operator typed into
 * ReserveAccount.balance. Nothing has ever checked it. That is the weakest link in the whole
 * stablecoin story: the ratio arithmetic is exact, the mint gate genuinely refuses to breach the
 * target, the supply figure is derived from chain-confirmed mints — and all of it is computed
 * over one input nobody verified. An exact computation over an asserted input is an asserted
 * output.
 *
 * UNVERIFIABLE is a first-class result, not an error to swallow. An account with no bank
 * reference, or a bank we cannot reach, is NOT verified — and must never be reported as though
 * the silence were agreement. §31: never conceal mismatches. Silence is a mismatch we could not
 * measure.
 *
 * Today the provider is SandboxBankBalanceProvider, so a VERIFIED result means "our books agree
 * with the sandbox bank's independent figure". It proves the path, not the money.
 */
@Injectable()
export class ReserveVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BANK_BALANCE_PROVIDER) private readonly bank: BankBalanceProvider,
  ) {}

  async verifyAccounts(tenantId: string, assetId: string): Promise<AccountVerification[]> {
    const accounts = await this.prisma.reserveAccount.findMany({
      where: { tenantId, assetId, status: 'ACTIVE' },
      select: { id: true, label: true, bankReference: true, balance: true },
    });

    const results: AccountVerification[] = [];
    for (const account of accounts) {
      const base = {
        reserveAccountId: account.id,
        label: account.label,
        bankReference: account.bankReference,
        ledgerBalance: account.balance,
        provider: this.bank.name,
      };

      if (!account.bankReference) {
        results.push({
          ...base,
          bankBalance: null,
          difference: null,
          status: 'UNVERIFIABLE',
          reason: 'Reserve account has no bank reference — nothing to check it against',
        });
        continue;
      }

      try {
        const reported = await this.bank.getBalance(account.bankReference);
        if (!reported) {
          results.push({
            ...base,
            bankBalance: null,
            difference: null,
            status: 'UNVERIFIABLE',
            reason: `Bank has no account ${account.bankReference}`,
          });
          continue;
        }

        const difference = subAmounts(account.balance, reported.balance);
        const agrees = compareAmounts(difference, '0') === 0;
        results.push({
          ...base,
          bankBalance: reported.balance,
          difference,
          status: agrees ? 'VERIFIED' : 'DRIFT',
          reason: agrees
            ? undefined
            : `Ledger claims ${account.balance}, bank reports ${reported.balance}`,
        });
      } catch (err) {
        // One unreachable account must not abort the sweep, and an outage must not read as
        // agreement — the same failure mode that once let a single malformed hash disable
        // reconciliation entirely.
        results.push({
          ...base,
          bankBalance: null,
          difference: null,
          status: 'UNVERIFIABLE',
          reason: `Bank lookup failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }
    return results;
  }

  /**
   * The reserve total PayChain is entitled to claim: only what the bank corroborates.
   *
   * Deliberately different from ReserveService.getState(), which sums the ledger. Drifting and
   * unverifiable accounts contribute ZERO here rather than their claimed figure, because the
   * question this answers is "how much can we prove?" — and an unproven figure answers it with
   * zero, not with itself.
   */
  async verifiedTotal(
    tenantId: string,
    assetId: string,
  ): Promise<{ verified: string; claimed: string; unverified: string; accounts: AccountVerification[] }> {
    const accounts = await this.verifyAccounts(tenantId, assetId);
    let verified = '0';
    let claimed = '0';
    for (const a of accounts) {
      claimed = addAmounts(claimed, a.ledgerBalance);
      if (a.status === 'VERIFIED') verified = addAmounts(verified, a.ledgerBalance);
    }
    return { verified, claimed, unverified: subAmounts(claimed, verified), accounts };
  }
}
