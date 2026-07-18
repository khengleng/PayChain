import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AdminRole } from '@paychain/database';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminPermissionGuard } from './admin-permission.guard';
import { CurrentAdmin, type AdminContext } from './admin-context';
import { PERMISSIONS, ROLE_PERMISSIONS, type Permission } from './roles';

/**
 * The access model, served from the code that enforces it (§7, §8).
 *
 * The admin console previously hardcoded its own list of role names, which could drift from
 * `roles.ts` silently — a console claiming an authorization model the API does not implement is
 * worse than no console at all. This endpoint returns the live catalog, so what an operator (or
 * an auditor) sees is by construction what the guards enforce.
 *
 * Readable by any authenticated admin: knowing the shape of the access model is not itself
 * sensitive, and an AUDITOR must be able to review it without holding write permissions.
 */
@Controller('admin/access-model')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
export class AccessModelController {
  @Get()
  get(@CurrentAdmin() admin: AdminContext) {
    const roles = (Object.keys(ROLE_PERMISSIONS) as AdminRole[]).map((role) => ({
      role,
      permissions: ROLE_PERMISSIONS[role],
      permissionCount: ROLE_PERMISSIONS[role].length,
    }));

    return {
      permissions: PERMISSIONS,
      roles,
      /** The caller's own effective access, so the console can explain "why can't I do X?". */
      me: {
        role: admin.role,
        permissions: admin.permissions,
        attributes: admin.attributes ?? {},
      },
      abac: {
        // Documented here because these are the attributes the policy actually reads
        // (see abac.ts). Anything not listed is not enforced.
        attributes: [
          {
            key: 'tenants',
            type: 'string[]',
            description:
              'Restricts the admin to these tenant ids. Empty or absent means unscoped (all tenants).',
            enforced: true,
          },
          {
            key: 'tenantRoots',
            type: 'string[]',
            description:
              'Wholesaler/distributor root tenants. On each request these expand to the full descendant retailer scope and are enforced as tenant ids.',
            enforced: true,
          },
          {
            key: 'region',
            type: 'string',
            description: 'Geographic scope. Declared in policy but no resource currently supplies a region.',
            enforced: false,
          },
          {
            key: 'clearance',
            type: 'number',
            description:
              'Minimum clearance gate. Declared in policy but no resource currently supplies requiredClearance.',
            enforced: false,
          },
        ],
      },
    };
  }
}

export type AccessModelPermission = Permission;
