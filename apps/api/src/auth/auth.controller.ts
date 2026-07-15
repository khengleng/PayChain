import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, type TokenResponse } from './auth.service';
import { TokenRequestDto } from './dto';

@Controller('oauth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/v1/oauth/token — OAuth2 client-credentials grant (§34). */
  @Post('token')
  @HttpCode(200)
  async token(@Body() body: TokenRequestDto): Promise<TokenResponse> {
    return this.auth.issueToken(body.client_id, body.client_secret);
  }
}
