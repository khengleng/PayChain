import { Body, Controller, Headers, HttpCode, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService, type TokenResponse } from './auth.service';
import { TokenRequestDto } from './dto';

@Controller('oauth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/v1/oauth/token — OAuth2 client-credentials grant (§34). */
  @Post('token')
  // Stricter than the global limit: credential verification is brute-force sensitive (§41).
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(200)
  async token(
    @Body() body: TokenRequestDto,
    @Ip() ip?: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<TokenResponse> {
    return this.auth.issueToken(body.client_id, body.client_secret, {
      ip: forwardedFor?.split(',')[0]?.trim() || ip,
      userAgent,
    });
  }
}
