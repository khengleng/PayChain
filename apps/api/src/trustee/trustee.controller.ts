import { Controller, Headers, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CorrelationId } from '../auth/auth-context';
import { TrusteeIpAllowlistGuard } from './trustee-ip-allowlist.guard';
import { TrusteeService, type TrusteeEventAck } from './trustee.service';

/** The raw request bytes captured by the body parser's verify hook in main.ts. */
interface RawBodyRequest {
  rawBody?: Buffer;
}

/**
 * Inbound receiver for the external trustee platform (docs/integration/API-CONTRACT.md).
 *
 * No JwtAuthGuard/ScopesGuard: the sender is a machine with no tenant token, and authenticity is
 * established by the Ed25519 signature verified in TrusteeService. Access is controlled in depth:
 * an optional source-IP allowlist (TrusteeIpAllowlistGuard) fronts the endpoint, and a dedicated
 * throttle limit bounds floods while still permitting the trustee's "replay all" bursts; the 256kb
 * body cap bounds payload size.
 */
@Controller('trustee')
@UseGuards(TrusteeIpAllowlistGuard)
export class TrusteeController {
  constructor(private readonly trustee: TrusteeService) {}

  @Post('events')
  @HttpCode(200)
  // Dedicated limit (higher than the global 120/min) instead of skipping the throttler entirely:
  // bounds a flood of unsigned garbage while still allowing the trustee's "replay all" bursts.
  @Throttle({ default: { ttl: 60_000, limit: 300 } })
  ingest(
    @Req() req: RawBodyRequest,
    @Headers('x-trustee-signature') signature: string | undefined,
    @Headers('x-trustee-key-id') keyId: string | undefined,
    @Headers('x-trustee-timestamp') timestamp: string | undefined,
    @Headers('x-trustee-event') eventType: string | undefined,
    @Headers('x-trustee-delivery') deliveryId: string | undefined,
    @CorrelationId() correlationId: string,
  ): Promise<TrusteeEventAck> {
    return this.trustee.ingest({
      rawBody: req.rawBody,
      signature,
      keyId,
      timestamp,
      eventType,
      deliveryId,
      correlationId,
    });
  }
}
