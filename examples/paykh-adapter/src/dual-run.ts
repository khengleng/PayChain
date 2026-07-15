/**
 * Dual-run / shadow reconciliation helper (§44 migration strategy). During migration PayKH
 * writes to BOTH its legacy ledger and PayChain, then compares them. This surfaces any
 * divergence before cutover; PayKH does not retire the legacy wallet until comparisons are
 * clean and migration is approved.
 */
export interface LedgerEntry {
  /** Business reference shared by both systems (e.g. PayKH event id). */
  reference: string;
  /** Net points effect of the entry. */
  points: number;
}

export interface ReconciliationResult {
  matched: number;
  mismatches: Array<{ reference: string; legacyPoints?: number; paychainPoints?: number; kind: string }>;
  clean: boolean;
}

/**
 * Compares two ledgers keyed by reference. Reports missing entries on either side and value
 * mismatches. `clean` is true only when every reference matches exactly — the bar for
 * advancing the migration.
 */
export function compareLedgers(legacy: LedgerEntry[], paychain: LedgerEntry[]): ReconciliationResult {
  const legacyMap = new Map(legacy.map((e) => [e.reference, e.points]));
  const paychainMap = new Map(paychain.map((e) => [e.reference, e.points]));
  const refs = new Set([...legacyMap.keys(), ...paychainMap.keys()]);

  const mismatches: ReconciliationResult['mismatches'] = [];
  let matched = 0;

  for (const ref of refs) {
    const l = legacyMap.get(ref);
    const p = paychainMap.get(ref);
    if (l === undefined) {
      mismatches.push({ reference: ref, paychainPoints: p, kind: 'MISSING_IN_LEGACY' });
    } else if (p === undefined) {
      mismatches.push({ reference: ref, legacyPoints: l, kind: 'MISSING_IN_PAYCHAIN' });
    } else if (l !== p) {
      mismatches.push({ reference: ref, legacyPoints: l, paychainPoints: p, kind: 'VALUE_MISMATCH' });
    } else {
      matched += 1;
    }
  }

  return { matched, mismatches, clean: mismatches.length === 0 };
}
