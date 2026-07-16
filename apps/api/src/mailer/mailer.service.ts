import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Email delivery via Resend (§ user choice). Uses the Resend REST API over fetch (no SDK).
 * If RESEND_API_KEY is not configured, runs in DEV mode: logs the message (including any
 * link) instead of sending, so flows still work in non-prod without leaking email.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger('Mailer');
  private readonly apiKey: string;
  private readonly from: string;

  constructor(@Inject(CONFIG) cfg: PayChainConfig) {
    this.apiKey = cfg.RESEND_API_KEY ?? '';
    this.from = cfg.MAIL_FROM;
  }

  get enabled(): boolean {
    return this.apiKey.length > 0;
  }

  async send(msg: MailMessage): Promise<{ sent: boolean }> {
    if (!this.enabled) {
      this.logger.warn(
        JSON.stringify({ level: 'warn', msg: 'mailer dev-mode (RESEND_API_KEY unset) — not sending', to: msg.to, subject: msg.subject, text: msg.text }),
      );
      return { sent: false };
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: this.from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Resend send failed (${res.status}) for ${msg.to} from "${this.from}": ${body}`);
        return { sent: false };
      }
      const id = (((await res.json().catch(() => ({}))) as { id?: string }).id) ?? '?';
      this.logger.log(`Resend accepted email to ${msg.to} (id=${id})`);
      return { sent: true };
    } catch (err) {
      this.logger.error(`Resend error: ${err instanceof Error ? err.message : 'unknown'}`);
      return { sent: false };
    }
  }
}
