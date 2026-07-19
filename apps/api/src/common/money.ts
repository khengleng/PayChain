/**
 * Money is always handled as a decimal string, never a JS number (§47 — no float money).
 * Arithmetic uses fixed-point BigInt scaled to 7 decimals (classic Stellar precision) so
 * balances never accumulate IEEE-754 drift.
 */

const AMOUNT_RE = /^\d{1,15}(\.\d{1,7})?$/;
const DECIMALS = 7;
const SCALE = 10n ** BigInt(DECIMALS);

export function isValidAmount(value: string): boolean {
  if (!AMOUNT_RE.test(value)) return false;
  return Number(value) > 0;
}

export function assertValidAmount(value: string): void {
  if (!isValidAmount(value)) {
    throw new Error(`Invalid amount "${value}" (positive decimal, max 7 dp)`);
  }
}

/** Parse a decimal string to a fixed-point BigInt (× 10^7). Accepts a leading '-'. */
export function toScaled(amount: string): bigint {
  const neg = amount.startsWith('-');
  const s = neg ? amount.slice(1) : amount;
  const [intPart = '0', fracPart = ''] = s.split('.');
  const frac = (fracPart + '0'.repeat(DECIMALS)).slice(0, DECIMALS);
  const scaled = BigInt(intPart || '0') * SCALE + BigInt(frac || '0');
  return neg ? -scaled : scaled;
}

/** Render a fixed-point BigInt back to a trimmed decimal string. */
export function fromScaled(scaled: bigint): string {
  const neg = scaled < 0n;
  const abs = neg ? -scaled : scaled;
  const intPart = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
  const s = frac ? `${intPart}.${frac}` : `${intPart}`;
  return neg ? `-${s}` : s;
}

export function addAmounts(a: string, b: string): string {
  return fromScaled(toScaled(a) + toScaled(b));
}

export function subAmounts(a: string, b: string): string {
  return fromScaled(toScaled(a) - toScaled(b));
}

export function sumAmounts(amounts: string[]): string {
  return fromScaled(amounts.reduce((s, x) => s + toScaled(x), 0n));
}

/**
 * Exact fixed-point product `a * b`. Each operand is scaled by SCALE, so the raw product is scaled
 * by SCALE² — divide by SCALE once to return to SCALE precision. Integer division truncates any
 * remainder below 7dp; both operands here (a coin supply and a unit value with ≤7dp) multiply
 * exactly for realistic denominations. Used for backing = supply × unitValue (§23 solvency).
 */
export function mulAmounts(a: string, b: string): string {
  return fromScaled((toScaled(a) * toScaled(b)) / SCALE);
}

/**
 * Fixed-point product rounded UP (ceiling). For a required-reserve / liability figure, rounding up
 * is the conservative direction — it never UNDER-states what the reserve must cover. Exact (== floor)
 * whenever the true product has ≤7dp, which is the realistic case for supply × unitValue. Both
 * operands are non-negative money amounts.
 */
export function mulAmountsCeil(a: string, b: string): string {
  const product = toScaled(a) * toScaled(b);
  const quotient = product / SCALE;
  const remainder = product % SCALE;
  return fromScaled(remainder > 0n ? quotient + 1n : quotient);
}

/** -1 | 0 | 1 comparing two decimal amounts exactly (no float). */
export function compareAmounts(a: string, b: string): number {
  const d = toScaled(a) - toScaled(b);
  return d < 0n ? -1 : d > 0n ? 1 : 0;
}

/**
 * Rounds a JS number (e.g. a rate multiplication result) to a valid 7-dp amount string.
 * Use only where a fractional computation is unavoidable, then validate before use.
 */
export function normalizeAmount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  return fromScaled(BigInt(Math.round(value * Number(SCALE))));
}
