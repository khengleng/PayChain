import { Global, Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';

/** §0.5 transactional outbox — global so any service can record a side effect atomically. */
@Global()
@Module({ providers: [OutboxService], exports: [OutboxService] })
export class OutboxModule {}
