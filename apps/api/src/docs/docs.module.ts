import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller';
import { DocsAccessGuard } from './docs-access.guard';

@Module({
  controllers: [DocsController],
  providers: [DocsAccessGuard],
})
export class DocsModule {}
