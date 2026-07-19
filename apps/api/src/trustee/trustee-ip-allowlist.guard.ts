import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import type { PayChainConfig } from '@paychain/config';
import { CONFIG } from '../config/config.module';

/**
 * Optional IP allowlist for the public trustee receiver — defence-in-depth ON TOP of the Ed25519
 * signature (which remains the real authenticator). When TRUSTEE_ALLOWED_IPS is set, only those
 * IPv4 addresses / CIDR ranges may reach POST /trustee/events; everyone else gets 403 before any
 * verification work. When unset, it allows any source (fail-open by design so the endpoint keeps
 * working until the trustee's egress IPs are configured — the signature still gates authenticity).
 *
 * The client IP is taken from the left-most X-Forwarded-For hop (Railway/most PaaS put the origin
 * client there), falling back to the socket address. Since this is defence-in-depth and not the
 * primary auth, an untrusted XFF is an acceptable tradeoff versus the signature guarantee.
 */
@Injectable()
export class TrusteeIpAllowlistGuard implements CanActivate {
  private readonly logger = new Logger(TrusteeIpAllowlistGuard.name);
  private readonly allow: string[];

  constructor(@Inject(CONFIG) config: PayChainConfig) {
    this.allow = config.TRUSTEE_ALLOWED_IPS;
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.allow.length === 0) return true; // not configured → signature-only

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      socket?: { remoteAddress?: string };
      ip?: string;
    }>();
    const clientIp = firstForwardedFor(req.headers['x-forwarded-for']) ?? req.ip ?? req.socket?.remoteAddress ?? '';

    if (this.allow.some((rule) => ipMatches(clientIp, rule))) return true;

    this.logger.warn(`Rejected trustee delivery from non-allowlisted IP: ${clientIp || 'unknown'}`);
    throw new ForbiddenException('Source address is not permitted for the trustee endpoint');
  }
}

function firstForwardedFor(header: string | undefined): string | null {
  if (!header) return null;
  const first = header.split(',')[0]?.trim();
  return first ? normalize(first) : null;
}

/** Strip an IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4) for consistent matching. */
function normalize(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice('::ffff:'.length) : ip;
}

/** Exact IPv4 match, or IPv4 CIDR (a.b.c.d/nn) containment. Non-IPv4 inputs never match. */
function ipMatches(ip: string, rule: string): boolean {
  const addr = normalize(ip);
  if (!rule.includes('/')) return addr === normalize(rule);
  const [range, bitsRaw] = rule.split('/');
  if (!range || bitsRaw === undefined) return false;
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const a = toUint32(addr);
  const r = toUint32(range);
  if (a === null || r === null) return false;
  if (bits === 0) return true;
  const mask = bits === 32 ? 0xffffffff : (~((1 << (32 - bits)) - 1)) >>> 0;
  return (a & mask) === (r & mask);
}

function toUint32(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    const n = Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}
