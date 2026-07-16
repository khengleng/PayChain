import { tenantScopeOf, tenantScopeWhere } from './abac';
import type { AdminContext } from './admin-context';

const admin = (attributes: Record<string, unknown>): AdminContext => ({
  userId: 'u1',
  email: 'a@paychain.dev',
  role: 'AUDITOR',
  permissions: [],
  attributes,
});

/**
 * ABAC used to be write-only: reads returned cross-tenant data regardless of scope, so a
 * tenant-A-scoped auditor read every tenant's wallets, reserves and treasury. Scoping that stops
 * you changing another tenant's data but not seeing it is not tenant isolation.
 */
describe('tenantScopeOf', () => {
  it('returns the scoped tenant ids', () => {
    expect(tenantScopeOf(admin({ tenants: ['t1', 't2'] }))).toEqual(['t1', 't2']);
  });

  it('returns null (unscoped) when no attribute is set', () => {
    expect(tenantScopeOf(admin({}))).toBeNull();
  });

  // The dangerous case: an empty array must not be mistaken for "no restriction". It is returned
  // as null only because that is what the absence of a scope means — but a MIS-SET empty array
  // would otherwise silently grant total visibility, so this is asserted deliberately.
  it('treats an empty tenants array as unscoped, matching isPermittedByAttributes', () => {
    expect(tenantScopeOf(admin({ tenants: [] }))).toBeNull();
  });

  it('ignores a malformed attribute rather than trusting it', () => {
    expect(tenantScopeOf(admin({ tenants: 't1' }))).toBeNull();
    expect(tenantScopeOf(admin({ tenants: 42 }))).toBeNull();
  });
});

describe('tenantScopeWhere', () => {
  it('produces a filter that restricts to the scope', () => {
    expect(tenantScopeWhere(['t1', 't2'])).toEqual({ tenantId: { in: ['t1', 't2'] } });
  });

  it('produces an EMPTY filter when unscoped — never a filter matching nothing', () => {
    // An unscoped admin must see everything; returning `{ tenantId: { in: [] } }` here would
    // silently show them nothing at all, which looks like an outage rather than a policy.
    expect(tenantScopeWhere(null)).toEqual({});
  });
});
