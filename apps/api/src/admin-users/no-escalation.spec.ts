import { ForbiddenException } from '@nestjs/common';
import type { AdminRole } from '@paychain/database';
import { assertCanActOn, assertCanGrantRole } from './no-escalation';
import { permissionsForRole } from '../admin-auth/roles';
import type { AdminContext } from '../admin-auth/admin-context';

const as = (role: AdminRole): AdminContext => ({
  userId: `u-${role}`,
  email: `${role.toLowerCase()}@paychain.dev`,
  role,
  permissions: permissionsForRole(role),
  attributes: {},
});

const target = (role: AdminRole) => ({ role, email: `${role.toLowerCase()}@paychain.dev` });

describe('no-escalation — granting roles (§7)', () => {
  it('BLOCKS the headline escalation: SECURITY_ADMIN creating a SUPER_ADMIN', () => {
    expect(() => assertCanGrantRole(as('SECURITY_ADMIN'), 'SUPER_ADMIN')).toThrow(ForbiddenException);
  });

  it('names the permissions being escalated, so the refusal is explainable', () => {
    // SECURITY_ADMIN deliberately lacks treasury:approve — that is the point of the role split.
    expect(() => assertCanGrantRole(as('SECURITY_ADMIN'), 'TREASURY_ADMIN')).toThrow(/treasury:approve/);
  });

  it('BLOCKS sideways escalation into a role with permissions you lack', () => {
    expect(() => assertCanGrantRole(as('TREASURY_ADMIN'), 'SECURITY_ADMIN')).toThrow(ForbiddenException);
    expect(() => assertCanGrantRole(as('SUPPORT_ADMIN'), 'COMPLIANCE_ADMIN')).toThrow(ForbiddenException);
  });

  it('ALLOWS a SUPER_ADMIN to grant anything — it already holds every permission', () => {
    for (const r of ['SUPER_ADMIN', 'SECURITY_ADMIN', 'TREASURY_ADMIN', 'AUDITOR'] as AdminRole[]) {
      expect(() => assertCanGrantRole(as('SUPER_ADMIN'), r)).not.toThrow();
    }
  });

  it('ALLOWS granting a strictly weaker role — the rule must not block normal work', () => {
    // OPERATIONS_ADMIN can still create read-only staff.
    expect(() => assertCanGrantRole(as('OPERATIONS_ADMIN'), 'SUPPORT_ADMIN')).not.toThrow();
    expect(() => assertCanGrantRole(as('SECURITY_ADMIN'), 'SECURITY_ADMIN')).not.toThrow();
  });
});

describe('no-escalation — acting on other accounts (the quiet takeover path)', () => {
  it('BLOCKS SECURITY_ADMIN resetting a SUPER_ADMIN (password/MFA reset = takeover)', () => {
    expect(() => assertCanActOn(as('SECURITY_ADMIN'), target('SUPER_ADMIN'))).toThrow(ForbiddenException);
  });

  it('BLOCKS acting on a peer who holds something you do not', () => {
    expect(() => assertCanActOn(as('SECURITY_ADMIN'), target('TREASURY_ADMIN'))).toThrow(ForbiddenException);
  });

  it('ALLOWS a SUPER_ADMIN to act on anyone', () => {
    expect(() => assertCanActOn(as('SUPER_ADMIN'), target('SUPER_ADMIN'))).not.toThrow();
  });

  it('ALLOWS an equal role to act on an equal role', () => {
    expect(() => assertCanActOn(as('TREASURY_ADMIN'), target('TREASURY_ADMIN'))).not.toThrow();
  });

  it('AUDITOR — read-only — cannot seize any account with real authority', () => {
    // AUDITOR holds no admin:manage so cannot reach these paths anyway; the rule is belt-and-braces.
    expect(() => assertCanActOn(as('AUDITOR'), target('SUPER_ADMIN'))).toThrow(ForbiddenException);
    expect(() => assertCanActOn(as('AUDITOR'), target('TREASURY_ADMIN'))).toThrow(ForbiddenException);
  });

  // Documents the deliberate boundary of the rule: reads are visibility, not authority, so they
  // do not block routine account management. If this flips, re-read excessOf's rationale.
  it('ignores :read differences — SECURITY_ADMIN can still reset support staff', () => {
    // SUPPORT_ADMIN holds asset:read/tenant:read which SECURITY_ADMIN lacks; that must not block.
    expect(() => assertCanActOn(as('SECURITY_ADMIN'), target('SUPPORT_ADMIN'))).not.toThrow();
    expect(() => assertCanGrantRole(as('SECURITY_ADMIN'), 'SUPPORT_ADMIN')).not.toThrow();
  });
});
