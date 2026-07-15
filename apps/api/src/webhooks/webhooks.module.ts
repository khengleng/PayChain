import { Module } from '@nestjs/common';
import { WebhookEmitterService } from './webhook-emitter.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookEmitterService],
  exports: [WebhookEmitterService],
})
export class WebhooksModule {}
