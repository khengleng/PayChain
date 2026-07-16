import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CorrelationId } from '../auth/auth-context';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { CurrentAdmin, type AdminContext } from './admin-context';
import { AdminLoginDto, MfaSetupDto, MfaVerifyDto } from './dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /** Step 1 — email/password → MFA challenge (never a full session token). */
  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  /** Step 2a — first-time enrollment: provision a TOTP secret + otpauth URI. */
  @Post('mfa/setup')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  setupMfa(@Body() dto: MfaSetupDto) {
    return this.auth.setupMfa(dto.challengeToken);
  }

  /** Step 2b — verify the 6-digit code → mint the admin session (completes enrollment). */
  @Post('mfa/verify')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  verifyMfa(@Body() dto: MfaVerifyDto, @CorrelationId() correlationId: string) {
    return this.auth.verifyMfa(dto.challengeToken, dto.code, correlationId);
  }

  /** The current admin's identity, role, permissions, attributes. */
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
