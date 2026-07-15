/**
 * Money is always handled as a decimal string, never a JS number (§47 — no float money).
 * These helpers validate and normalize amounts for classic Stellar assets (7 decimals).
 */

const AMOUNT_RE = /^\d{1,15}(\.\d{1,7})?$/;

export function isValidAmount(value: string): boolean {
  if (!AMOUNT_RE.test(value)) return false;
  return Number(value) > 0;
}

export function assertValidAmount(value: string): void {
  if (!isValidAmount(value)) {
    throw new Error(`Invalid amount "${value}" (positive decimal, max 7 dp)`);
  }
}
