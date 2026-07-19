import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../../config/config.module';

export interface MintAuthorizationRequest {
  reference: string;
  tenantId: string;
  assetId: string;
  amount: string;
  destination: string;
}

/**
 * Outbound client for the trustee's API — PayChain → trustee. Currently requests that the trustee
 * authorize a specific mint (identified by `reference` = the PayChain mint-request id). The signed
 * `mint.authorization.approved` returns asynchronously via the webhook and is enforced at mint time.
 *
 * Best-effort and fail-open by design: it never throws into the mint saga, and when TRUSTEE_API_KEY
 * is unset it simply skips (dev fallback, like the mailer) so the saga never blocks on a missing
 * credential. Verify uses fetch, like MailerService.
 */
@Injectable()
export class TrusteeApiClient {
  private readonly logger = new Logger(TrusteeApiClient.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(@Inject(CONFIG) config: PayChainConfig) {
    this.baseUrl = config.TRUSTEE_API_BASE_URL;
    this.apiKey = config.TRUSTEE_API_KEY ?? '';
  }

  async requestMintAuthorization(input: MintAuthorizationRequest): Promise<{ requested: boolean }> {
    if (!this.apiKey) {
      this.logger.warn(`TRUSTEE_API_KEY not set — skipping authorization request for ${input.reference}`);
      return { requested: false };
    }
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/paychain/mint-authorizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          // Idempotent on the trustee side: re-requesting the same mint id must not duplicate.
          'Idempotency-Key': input.reference,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        this.logger.error(`Trustee authorization request ${input.reference} → HTTP ${res.status}`);
        return { requested: false };
      }
      return { requested: true };
    } catch (err) {
      this.logger.error(
        `Trustee authorization request ${input.reference} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { requested: false };
    }
  }
}
