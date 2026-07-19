import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CorrelationId } from '../auth/auth-context';
import { PartnerService } from './partner.service';
import { PartnerAuthGuard } from './partner-auth.guard';
import { CurrentPartner, type PartnerContext } from './partner-context';
import { LoginPartnerDto, RegisterPartnerDto } from './dto';

/**
 * Self-service partner surface. `register` and `login` are public (a prospective partner has no
 * token yet) but rate-limited; the rest require a partner JWT (PartnerAuthGuard) and only ever act
 * on the caller's own application/credentials.
 */
@Controller('partner')
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(201)
  register(@Body() dto: RegisterPartnerDto, @CorrelationId() correlationId: string) {
    return this.partner.register(dto, correlationId);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @HttpCode(200)
  login(@Body() dto: LoginPartnerDto) {
    return this.partner.login(dto);
  }

  @Get('me')
  @UseGuards(PartnerAuthGuard)
  me(@CurrentPartner() partner: PartnerContext) {
    return this.partner.me(partner);
  }

  @Post('credentials/rotate')
  @UseGuards(PartnerAuthGuard)
  @HttpCode(200)
  rotate(@CurrentPartner() partner: PartnerContext, @CorrelationId() correlationId: string) {
    return this.partner.rotateCredentials(partner, correlationId);
  }
}
