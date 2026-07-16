import { ForbiddenException } from '@nestjs/common';
import type { AdminRole } from '@paychain/database';
import type { AdminContext } from '../admin-auth/admin-context';
import { permissionsForRole, type Permission } from '../admin-auth/roles';

/**
 * No-escalation rules for admin user management (§7, §8).
 *
 * `admin:manage` was an unbounded power: nothing stopped its holder assigning a role higher than
 * their own, so a SECURITY_ADMIN — deliberately denied treasury:approve — could simply create a
 * SUPER_ADMIN and use it. Worse, resetPassword returns a temporary password and resetMfa strips
 * the second factor, so the same permission could take over any existing account including a
 * SUPER_ADMIN, with the trail showing only a routine "reset_mfa". Every boundary in roles.ts
 * collapsed to one.
 *
 * The rule is the standard one: you cannot grant a permission you do not hold, and you cannot
 * seize an account that holds permissions you do not. Both directions matter — granting is the
 * obvious escalation, takeover is the quiet one.
 */

/**
 * Permissions the target role has that the actor lacks — restricted to those that grant the
 * ability to *do* something. Empty means no escalation.
 *
 * `:read` permissions are deliberately excluded. The principle is "you cannot grant or seize the
 * ability to act beyond your own authority"; reads are visibility, not authority, and no secret
 * (keys, client secrets, MFA seeds) is exposed through a read endpoint. Counting them would break
 * routine work for no security gain: SECURITY_ADMIN holds neither asset:read nor tenant:read, so
 * a strict rule would stop it resetting a SUPPORT_ADMIN's password — exactly what that role is
 * for — while still not preventing anything an attacker would want.
 *
 * The trade-off is real and bounded: an actor could create or seize an account to gain a read
 * they lack. That is a minor, audited escalation. Gaining treasury:approve or admin:manage is
 * not, and remains blocked.
 */
function excessOf(actor: AdminContext, role: AdminRole): Permission[] {
  const held = new Set(actor.permissions);
  return permissionsForRole(role).filter((p) => !held.has(p) && !p.endsWith(':read'));
}

/**
 * Refuses to grant a role carrying permissions the actor does not hold themselves.
 * A SUPER_ADMIN holds everything, so it is unaffected — the rule binds exactly the roles that
 * were never meant to be able to promote.
 */
export function assertCanGrantRole(actor: AdminContext, role: AdminRole): void {
  const excess = excessOf(actor, role);
  if (excess.length > 0) {
    throw new ForbiddenException(
      `Cannot assign role ${role}: it grants permissions you do not hold (${excess.join(', ')}). ` +
        `An admin may not create an account more powerful than their own.`,
    );
  }
}

/**
 * Refuses account-takeover actions (password reset, MFA reset, role/status change) against an
 * admin who holds permissions the actor lacks.
 *
 * Without this, `admin:manage` is a universal skeleton key: reset the password, reset the MFA,
 * log in as them. Note this is about the TARGET's power, not their role name — a SUPPORT_ADMIN
 * scoped up by attributes is still judged on the permissions they actually carry.
 */
export function assertCanActOn(actor: AdminContext, target: { role: AdminRole; email: string }): void {
  const excess = excessOf(actor, target.role);
  if (excess.length > 0) {
    throw new ForbiddenException(
      `Cannot act on ${target.email} (${target.role}): they hold permissions you do not ` +
        `(${excess.join(', ')}). Taking over an account more powerful than your own is escalation.`,
    );
  }
}
