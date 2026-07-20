/**
 * Fixed-point conversion between PayChain decimal amount strings (e.g. "500", "0.01") and ERC-20
 * integer base units (bigint), using the token's `decimals`. All BigInt — never float money (§ money).
 *
 * These mirror viem's parseUnits/formatUnits but are kept dependency-free so the provider logic is
 * unit-testable without importing viem, and so the money math has one auditable implementation.
 */

/** "0.01" @ 7 decimals -> 100000n. Rejects malformed input and more fractional digits than decimals. */
export function toBaseUnits(amount: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    throw new Error(`invalid amount "${amount}": expected a non-negative decimal`);
  }
  const [whole = '0', frac = ''] = amount.split('.');
  if (frac.length > decimals) {
    throw new Error(`amount "${amount}" has more than ${decimals} fractional digits (token precision)`);
  }
  const paddedFrac = frac.padEnd(decimals, '0');
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFrac || '0');
}

/** 100000n @ 7 decimals -> "0.01". Trims trailing zeros; whole amounts have no decimal point. */
export function fromBaseUnits(value: bigint, decimals: number): string {
  if (decimals === 0) return value.toString();
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const divisor = 10n ** BigInt(decimals);
  const whole = abs / divisor;
  const frac = (abs % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  const body = frac ? `${whole}.${frac}` : `${whole}`;
  return negative ? `-${body}` : body;
}
