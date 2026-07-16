import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { CurrentAdmin, type AdminContext } from './admin-context';
import { AdminLoginDto } from './dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /** POST /api/v1/admin/auth/login — email/password → admin JWT (§8). */
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // brute-force defense (§41)
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto, @CorrelationId() correlationId: string) {
    return this.auth.login(dto.email, dto.password, correlationId);
  }

  /** GET /api/v1/admin/auth/me — the current admin's identity, role, permissions, attributes. */
  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: AdminContext) {
    return {
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      attributes: admin.attributes,
    };
  }
}
