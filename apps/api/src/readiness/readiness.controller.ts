import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { ReadinessService } from './readiness.service';
import { EmergencyService } from './emergency.service';
import { EmergencyActionDto, SetGateDto } from './dto';

/**
 * Production-readiness + emergency controls admin API (§37, §43). Platform-level, scope-gated.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class ReadinessController {
  constructor(
    private readonly readiness: ReadinessService,
    private readonly emergency: EmergencyService,
  ) {}

  @Get('readiness')
  @RequireScopes('platform.readiness')
  async getReadiness() {
    const [gates, summary] = await Promise.all([this.readiness.list(), this.readiness.summary()]);
    return { summary, gates };
  }

  @Post('readiness/:key')
  @RequireScopes('platform.readiness')
  setGate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Param('key') key: string,
    @Body() dto: SetGateDto,
  ) {
    return this.readiness.setGate(auth, key, dto, corr);
  }

  @Post('emergency')
  @RequireScopes('platform.emergency')
  emergencyAction(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() corr: string,
    @Body() dto: EmergencyActionDto,
  ) {
    return this.emergency.execute(auth, dto, corr);
  }

  @Get('emergency/events')
  @RequireScopes('platform.emergency')
  listEvents(@CurrentAuth() auth: AuthContext) {
    return this.emergency.listEvents(auth);
  }

  /** Attempt to enable mainnet writes — blocked until every mandatory readiness gate passes. */
  @Post('mainnet/enable')
  @RequireScopes('platform.emergency')
  enableMainnet(@CurrentAuth() auth: AuthContext, @CorrelationId() corr: string) {
    return this.emergency.enableMainnetWrites(auth, corr);
  }
}
