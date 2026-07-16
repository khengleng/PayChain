import type { ReactNode } from 'react';

// Shared building blocks for the read-only admin console screens. Server components render
// live data fetched with the admin's JWT; these keep every screen visually consistent.

export interface Column<T> {
  header: string;
  /** Cell renderer. Return a string/number/node. */
  cell: (row: T) => ReactNode;
  /** Right-align + tabular numerals for numeric columns. */
  num?: boolean;
  /** Allow wrapping (default is nowrap). */
  wrap?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'Nothing to show yet.',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, i: number) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="table-wrap">
        <div className="empty">{empty}</div>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={c.wrap ? 'wrap' : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {columns.map((c) => (
                <td key={c.header} className={[c.num ? 'num' : '', c.wrap ? 'wrap' : ''].join(' ').trim() || undefined}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const GOOD = new Set([
  'ACTIVE', 'ACTIVE ', 'PASSED', 'WAIVED', 'COMPLETED', 'CONFIRMED', 'RESOLVED', 'APPROVED',
  'CLOSED', 'ENABLED', 'VERIFIED', 'LIVE', 'EXECUTED',
]);
const BAD = new Set([
  'FAILED', 'BLOCKED', 'SUSPENDED', 'DISABLED', 'REJECTED', 'CANCELLED', 'CRITICAL', 'FROZEN',
  'REVOKED', 'ERROR',
]);
const WARN = new Set([
  'PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'OPEN', 'REQUESTED', 'QUOTED', 'DRAFT',
  'LEGAL_REVIEW', 'REVIEW', 'HELD', 'HOLD', 'HIGH', 'MEDIUM', 'INACTIVE', 'UNVERIFIED',
]);

/** Maps an arbitrary domain status/severity to a semantic pill tone. */
export function StatusPill({ value }: { value: string | null | undefined }) {
  if (!value) return <span style={{ color: 'var(--muted)' }}>—</span>;
  const v = value.toUpperCase();
  const tone = GOOD.has(v) ? 'good' : BAD.has(v) ? 'bad' : WARN.has(v) ? 'warn' : 'neutral';
  return <span className={`pill ${tone}`}>{value}</span>;
}

/** Formats a date-ish value compactly; returns em dash for null. */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

/** Renders the standard "data unavailable / not permitted" panel. */
export function Unavailable({ perm }: { perm: string }) {
  return (
    <div className="notice">
      Live data is unavailable — your role may lack the <code>{perm}</code> permission, or the
      API is unreachable.
    </div>
  );
}

/** Truncated monospace id/hash. */
export function Mono({ value, max = 12 }: { value: string | null | undefined; max?: number }) {
  if (!value) return <span style={{ color: 'var(--muted)' }}>—</span>;
  const short = value.length > max ? `${value.slice(0, max)}…` : value;
  return (
    <span className="mono" title={value} style={{ fontSize: 12 }}>
      {short}
    </span>
  );
}
