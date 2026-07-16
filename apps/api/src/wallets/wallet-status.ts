import { ForbiddenException } from '@nestjs/common';
import type { WalletStatus } from '@paychain/database';

/**
 * Wallet statuses that deliberately stop value moving (§37).
 *
 * FROZEN is the routine and break-glass compliance control; SUSPENDED, CLOSING and CLOSED are
 * lifecycle stops. Each is an administrative decision to halt a wallet, so honouring them is the
 * whole point of setting them — before this existed, `status` was written by freeze and read by
 * nothing, and a FROZEN wallet transferred its full balance.
 */
const BLOCKED_FOR_VALUE: readonly WalletStatus[] = ['FROZEN', 'SUSPENDED', 'CLOSING', 'CLOSED'];

/**
 * RESTRICTED is deliberately NOT blocked here.
 *
 * The enum defines it but no code sets it and no policy defines what it restricts — blocking it
 * would invent a rule the product has not decided, and allowing it silently is at least honest
 * about that. It needs product semantics (limits? asset-scoped?) before it can be enforced.
 * PENDING is likewise allowed: an unfunded account simply fails on-chain, which is truthful.
 */
export function assertWalletCanTransact(wallet: {
  id: string;
  status: WalletStatus;
}): void {
  if (BLOCKED_FOR_VALUE.includes(wallet.status)) {
    throw new ForbiddenException(
      `Wallet ${wallet.id} is ${wallet.status} and cannot send or receive value`,
    );
  }
}

export { BLOCKED_FOR_VALUE };
