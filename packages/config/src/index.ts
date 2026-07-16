import { z } from 'zod';

/**
 * Central, validated environment configuration for PayChain (§4, §47).
 *
 * All external configuration flows through this schema. Fail fast on startup if
 * anything required is missing or malformed — we never boot with half-configured
 * blockchain or database access.
 *
 * NOTE (README §0.2 / §0.7): STELLAR_NETWORK is constrained to non-mainnet values in
 * M0. Mainnet stablecoin/production writes are gated and intentionally cannot be
 * selected from configuration alone at this milestone.
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

  // M0 supports testnet + futurenet only. Mainnet is deliberately excluded here.
  STELLAR_NETWORK: z.enum(['testnet', 'futurenet']).default('testnet'),
  STELLAR_RPC_PRIMARY_URL: z.string().url(),
  STELLAR_RPC_SECONDARY_URL: z.string().url().optional().or(z.literal('')),
  STELLAR_HORIZON_URL: z.string().url(),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  STELLAR_FRIENDBOT_URL: z.string().url().optional().or(z.literal('')),

  STELLAR_SPONSOR_PUBLIC_KEY: z.string().optional().or(z.literal('')),
  STELLAR_SPONSOR_SECRET_KEY: z.string().optional().or(z.literal('')),

  KEY_MANAGEMENT_PROVIDER: z.enum(['local-dev', 'kms', 'hsm', 'mpc']).default('local-dev'),
  KEY_ENCRYPTION_KEY: z.string().min(16),

  // Email (Resend) for password-reset links. If RESEND_API_KEY is unset, the mailer runs in
  // dev mode (logs the link instead of sending). MAIL_FROM must be a Resend-verified sender.
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  MAIL_FROM: z.string().default('PayChain <noreply@cambobia.com>'),
  ADMIN_PORTAL_URL: z.string().url().default('https://paychain.cambobia.com'),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional().or(z.literal('')),
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
