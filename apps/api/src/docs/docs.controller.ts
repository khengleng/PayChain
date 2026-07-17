import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { buildOpenApiSpec } from './openapi';

@Controller()
@SkipThrottle()
export class DocsController {
  @Get('openapi.json')
  openapi() {
    return buildOpenApiSpec();
  }
}

