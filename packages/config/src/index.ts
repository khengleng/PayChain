import { z } from 'zod';

function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/**
 * Central, validated environment configuration for PayChain (§4, §47).
 *
 * All external configuration flows through this schema. Fail fast on startup if
 * anything required is missing or malformed — we never boot with half-configured
 * blockchain or database access.
 *
 * Two constraints fail closed here rather than being enforced elsewhere, because config is the
 * one place they cannot be bypassed:
 *
 * - STELLAR_NETWORK (README §0.2 / §0.7): constrained to non-mainnet values. Mainnet
 *   stablecoin/production writes are gated and intentionally cannot be selected from
 *   configuration alone at this milestone.
 * - KEY_MANAGEMENT_PROVIDER (README §0.6, §11): only 'local-dev' is implemented; kms/hsm/mpc
 *   are rejected so the enum cannot imply custody guarantees the code does not provide.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(3600),

  // Compensating transactions at/above this amount require maker-checker approval (§19).
  COMPENSATION_APPROVAL_THRESHOLD: z.coerce.number().nonnegative().default(100000),

  /**
   * How long a reserve figure stays usable for minting (§23: "Do not mint on stale or
   * unreconciled reserve data").
   *
   * A reserve balance is only as good as the last time someone corroborated it. With no custodian
   * feed, that corroboration is an operator taking a snapshot — so this is the maximum age of the
   * newest snapshot before minting is refused. Short enough that a stale figure cannot silently
   * back new issuance; long enough not to block a working day.
   */
  RESERVE_MAX_STALENESS_HOURS: z.coerce.number().positive().default(24),

  // M0 supports testnet + futurenet only. Mainnet is deliberately excluded here.
  STELLAR_NETWORK: z.enum(['testnet', 'futurenet']).default('testnet'),
  STELLAR_RPC_PRIMARY_URL: z.string().url(),
  STELLAR_RPC_SECONDARY_URL: z.string().url().optional().or(z.literal('')),
  STELLAR_HORIZON_URL: z.string().url(),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  STELLAR_FRIENDBOT_URL: z.string().url().optional().or(z.literal('')),

  STELLAR_SPONSOR_PUBLIC_KEY: z.string().optional().or(z.literal('')),
  STELLAR_SPONSOR_SECRET_KEY: z.string().optional().or(z.literal('')),

  // Only 'local-dev' is implemented; the other values are rejected at boot (see refine below).
  KEY_MANAGEMENT_PROVIDER: z.enum(['local-dev', 'kms', 'hsm', 'mpc']).default('local-dev'),
  KEY_ENCRYPTION_KEY: z.string().min(16),

  // Email (Resend) for password-reset links. If RESEND_API_KEY is unset, the mailer runs in
  // dev mode (logs the link instead of sending). MAIL_FROM must be a Resend-verified sender.
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  MAIL_FROM: z.string().default('PayChain <noreply@cambobia.com>'),
  PAYCHAIN_PUBLIC_API_URL: z.string().url().default('https://api.paychain.cambobia.com'),
  ADMIN_PORTAL_URL: z.string().url().default('https://paychain.cambobia.com'),
  PAYCHAIN_DOCS_URL: z.string().url().default('https://docs.paychain.cambobia.com'),
  PAYKH_CLIENT_URL: z.string().url().default('https://paykh.cambobia.com'),
  // Developer portal base URL, used in onboarding emails (register/status/dashboard links).
  PARTNER_PORTAL_URL: z.string().url().default('https://developer.paychain.cambobia.com'),
  API_ALLOWED_ORIGINS: z
    .string()
    .default(
      [
        'https://paychain.cambobia.com',
        'https://docs.paychain.cambobia.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
      ].join(','),
    )
    .transform(splitOrigins),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().or(z.literal('')),

  // The trustee platform signs its outbound webhooks with an Ed25519 PRIVATE key and publishes the
  // PUBLIC key (keyId in TRUSTEE_WEBHOOK_KEY_ID). PayChain verifies with the public key — a public
  // value, not a secret, but still injected as config. PEM SubjectPublicKeyInfo, newlines may be
  // escaped as \n (Railway single-line env). Optional: when unset, POST /api/v1/trustee/events
  // fails closed (503) rather than accepting events it cannot cryptographically verify.
  TRUSTEE_WEBHOOK_PUBLIC_KEY: z.string().optional().or(z.literal('')),
  // The key identifier the trustee stamps on each delivery (e.g. X-Trustee-Key-Id: webhook-v1).
  // Deliveries whose key id does not match are rejected — this is the rotation hook.
  TRUSTEE_WEBHOOK_KEY_ID: z.string().default('webhook-v1'),
  // The trustee's published JWKS of purpose-specific Ed25519 keys (WEBHOOK, MINT_AUTHORIZATION,
  // RESERVE_SNAPSHOT, ATTESTATION, …). Used to verify inner signed artifacts inside events. When
  // unreachable, WEBHOOK verification falls back to the pinned TRUSTEE_WEBHOOK_PUBLIC_KEY above.
  TRUSTEE_JWKS_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || 'https://api.trustee.cambobia.com/.well-known/trustee-signing-keys'),
  // Optional IP allowlist for POST /api/v1/trustee/events (defence-in-depth on top of the Ed25519
  // signature). Comma-separated IPv4 addresses or CIDR ranges. Empty = allow any source (the
  // signature remains the gate) so the endpoint keeps working before the trustee's egress IPs are known.
  TRUSTEE_ALLOWED_IPS: z
    .string()
    .optional()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  // When false, GET /api/v1/openapi.json requires an admin token instead of being public. Default
  // true preserves the developer portal's live API reference, which fetches this spec anonymously.
  DOCS_PUBLIC: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
  // Base URL of the trustee's API, for PayChain → trustee outbound calls (requesting a mint
  // authorization for a specific mint request). Defaults to the trustee's production host.
  TRUSTEE_API_BASE_URL: z.string().url().default('https://api.trustee.cambobia.com'),
  // Bearer credential PayChain presents to the trustee's API (the trustee-issued PayChain key).
  // Optional: when unset, outbound authorization requests are skipped and logged (dev fallback,
  // like the mailer), so the mint saga never blocks on a missing credential.
  TRUSTEE_API_KEY: z.string().optional().or(z.literal('')),
}).superRefine((cfg, ctx) => {
  // KEY_MANAGEMENT_PROVIDER advertises kms/hsm/mpc, but only the local-dev provider is built:
  // CryptoService wraps AES-256-GCM over KEY_ENCRYPTION_KEY and every signing path decrypts the
  // secret into application memory (WalletsService.requireSecret). Accepting 'kms' here would
  // silently keep using that dev provider while implying custody guarantees we do not have —
  // so it fails closed at boot instead, exactly like the STELLAR_NETWORK mainnet exclusion.
  // Lifting this requires a signer abstraction (key never leaves the KMS/HSM), which is the
  // `key_management` readiness gate (§0.6, §43) — BLOCKED as of this writing.
  // A sponsor is only half-configured if one key is present without the other — that would throw
  // at wallet-creation time rather than at boot, which is the wrong place to find out.
  const hasSponsorPub = Boolean(cfg.STELLAR_SPONSOR_PUBLIC_KEY);
  const hasSponsorSec = Boolean(cfg.STELLAR_SPONSOR_SECRET_KEY);
  if (hasSponsorPub !== hasSponsorSec) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['STELLAR_SPONSOR_SECRET_KEY'],
      message:
        'STELLAR_SPONSOR_PUBLIC_KEY and STELLAR_SPONSOR_SECRET_KEY must be set together — a ' +
        'half-configured sponsor fails at wallet creation instead of at startup.',
    });
  }

  // Off testnet there is no friendbot, so without a sponsor every wallet would be created
  // unfunded and fail on first use. Refuse to start rather than mint dead accounts.
  if (cfg.STELLAR_NETWORK !== 'testnet' && !hasSponsorSec && !cfg.STELLAR_FRIENDBOT_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['STELLAR_SPONSOR_SECRET_KEY'],
      message:
        `No account funding path on network '${cfg.STELLAR_NETWORK}': friendbot is testnet-only, ` +
        'so a sponsor account is required or every created wallet would be unfunded and unusable.',
    });
  }

  if (cfg.KEY_MANAGEMENT_PROVIDER !== 'local-dev') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['KEY_MANAGEMENT_PROVIDER'],
      message:
        `'${cfg.KEY_MANAGEMENT_PROVIDER}' is not implemented — no KMS/HSM/MPC signer exists yet, ` +
        `so this would silently fall back to dev-grade encrypted keys. Only 'local-dev' is ` +
        `supported until the key_management readiness gate (§0.6) passes.`,
    });
  }
});

export type PayChainConfig = z.infer<typeof envSchema>;

let cached: PayChainConfig | undefined;

/**
 * Parse and cache configuration from the given source (defaults to process.env).
 * Throws a descriptive error listing every invalid field.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): PayChainConfig {
  if (cached) return cached;
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid PayChain configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: clear the cached config so a new source can be parsed. */
export function resetConfigCache(): void {
  cached = undefined;
}
