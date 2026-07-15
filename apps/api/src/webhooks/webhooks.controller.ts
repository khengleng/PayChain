import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CorrelationId, CurrentAuth, type AuthContext } from '../auth/auth-context';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { CreateWebhookEndpointDto } from './dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  @RequireScopes('webhook.manage')
  create(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Body() dto: CreateWebhookEndpointDto,
  ) {
    return this.webhooks.create(auth, dto, correlationId);
  }

  @Get()
  @RequireScopes('webhook.manage')
  list(@CurrentAuth() auth: AuthContext) {
    return this.webhooks.list(auth);
  }

  @Delete(':id')
  @RequireScopes('webhook.manage')
  @HttpCode(204)
  async remove(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.webhooks.remove(auth, id, correlationId);
  }

  @Post(':id/rotate-secret')
  @RequireScopes('webhook.manage')
  rotate(
    @CurrentAuth() auth: AuthContext,
    @CorrelationId() correlationId: string,
    @Param('id') id: string,
  ) {
    return this.webhooks.rotateSecret(auth, id, correlationId);
  }
}
