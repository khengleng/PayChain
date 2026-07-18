import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CorrelationId } from '../auth/auth-context';
import { TrusteeService, type TrusteeEventAck } from './trustee.service';

/** The raw request bytes captured by the body parser's verify hook in main.ts. */
interface RawBodyRequest {
  rawBody?: Buffer;
}

/**
 * Inbound receiver for the external trustee platform (docs/integration/API-CONTRACT.md).
 *
 * No JwtAuthGuard/ScopesGuard: the sender is a machine with no tenant token, and authenticity is
 * established by the HMAC signature verified in TrusteeService. Throttling is skipped so a
 * "replay all dead-lettered" backlog flush is not rate-limited — signature verification rejects
 * unauthenticated traffic cheaply, and the 256kb body cap still bounds payload size.
 */
@Controller('trustee')
export class TrusteeController {
  constructor(private readonly trustee: TrusteeService) {}

  @Post('events')
  @HttpCode(200)
  @SkipThrottle()
  ingest(
    @Req() req: RawBodyRequest,
    @Headers('x-trustee-signature') signature: string | undefined,
    @Headers('x-trustee-timestamp') timestamp: string | undefined,
    @Headers('x-trustee-event') eventType: string | undefined,
    @Headers('x-trustee-delivery') deliveryId: string | undefined,
    @CorrelationId() correlationId: string,
  ): Promise<TrusteeEventAck> {
    return this.trustee.ingest({
      rawBody: req.rawBody,
      signature,
      timestamp,
      eventType,
      deliveryId,
      correlationId,
    });
  }
}
