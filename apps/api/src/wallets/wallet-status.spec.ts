import { ForbiddenException } from '@nestjs/common';
import type { WalletStatus } from '@paychain/database';
import { assertWalletCanTransact } from './wallet-status';

const wallet = (status: WalletStatus) => ({ id: 'w1', status });

/**
 * Freeze is the control a regulator is most likely to test live: "freeze this wallet, now try to
 * spend from it." Until this guard existed, `status` was written by freeze and read by no money
 * path — a FROZEN wallet transferred its full balance.
 */
describe('assertWalletCanTransact (§37)', () => {
  it('blocks a FROZEN wallet — the compliance control', () => {
    expect(() => assertWalletCanTransact(wallet('FROZEN'))).toThrow(ForbiddenException);
  });

  it('blocks SUSPENDED, CLOSING and CLOSED wallets', () => {
    for (const s of ['SUSPENDED', 'CLOSING', 'CLOSED'] as WalletStatus[]) {
      expect(() => assertWalletCanTransact(wallet(s))).toThrow(ForbiddenException);
    }
  });

  it('allows an ACTIVE wallet', () => {
    expect(() => assertWalletCanTransact(wallet('ACTIVE'))).not.toThrow();
  });

  it('names the wallet and its status, so the caller knows why they were refused', () => {
    expect(() => assertWalletCanTransact(wallet('FROZEN'))).toThrow(/w1 is FROZEN/);
  });

  // Documents a deliberate decision rather than an oversight: RESTRICTED has no product
  // semantics and no writer, so enforcing it would invent a rule. If this test starts failing,
  // someone has given RESTRICTED a meaning and this guard must be updated with it.
  it('does NOT block RESTRICTED (undefined semantics) or PENDING (fails on-chain anyway)', () => {
    expect(() => assertWalletCanTransact(wallet('RESTRICTED'))).not.toThrow();
    expect(() => assertWalletCanTransact(wallet('PENDING'))).not.toThrow();
  });
});
