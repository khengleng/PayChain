import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminPermissionGuard, RequireAdminPermission } from '../admin-auth/admin-permission.guard';
import { CurrentAdmin, type AdminContext } from '../admin-auth/admin-context';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminDto, UpdateAdminDto } from './dto';

/** Admin user management (§8) — requires the admin:manage permission. */
@Controller('admin/users')
@UseGuards(AdminAuthGuard, AdminPermissionGuard)
@RequireAdminPermission('admin:manage')
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@CurrentAdmin() admin: AdminContext, @CorrelationId() corr: string, @Body() dto: CreateAdminDto) {
    return this.users.create(admin, dto, corr);
  }

  @Patch(':id')
  update(
    @CurrentAdmin() admin: AdminContext,
    @CorrelationId() corr: string,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.users.update(admin, id, dto, corr);
  }

  @Post(':id/reset-password')
  resetPassword(@CurrentAdmin() admin: AdminContext, @CorrelationId() corr: string, @Param('id') id: string) {
    return this.users.resetPassword(admin, id, corr);
  }

  @Post(':id/reset-mfa')
  resetMfa(@CurrentAdmin() admin: AdminContext, @CorrelationId() corr: string, @Param('id') id: string) {
    return this.users.resetMfa(admin, id, corr);
  }
}
