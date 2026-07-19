import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { buildOpenApiSpec } from './openapi';
import { DocsAccessGuard } from './docs-access.guard';

@Controller()
@SkipThrottle()
@UseGuards(DocsAccessGuard)
export class DocsController {
  @Get('openapi.json')
  openapi() {
    return buildOpenApiSpec();
  }
}
