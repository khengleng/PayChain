# Railway Deployment

PayChain deploys on Railway, in the **PayChain** project under the `cambobia` workspace. Every
service builds from the repo root as build context.

## Services

| Service | Dockerfile (via `RAILWAY_DOCKERFILE_PATH`) | Production domain | Notes |
|---|---|---|---|
| paychain-api | `apps/api/Dockerfile` | `api.paychain.cambobia.com` | NestJS API, runs `prisma migrate deploy` on start (Dockerfile CMD) |
| paychain-worker | `apps/worker/Dockerfile` | — (internal only) | BullMQ worker: confirmation, webhook delivery, reconciliation |
| paychain-admin | `apps/admin-portal/Dockerfile` | `paychain.cambobia.com` | Next.js admin console; auth-gated |
| paychain-developer | `apps/developer-portal/Dockerfile` | `developer.paychain.cambobia.com` | Next.js developer portal; public, no auth |
| Postgres | Railway plugin | — | Managed PostgreSQL |
| Redis | Railway plugin | — | Managed Redis |

Note the domain split: `paychain.cambobia.com` (apex) serves the **admin** console, while the API
is on the `api.` subdomain. The worker has no custom domain — it consumes queues and serves no
public traffic.

**Multi-service build selection:** do NOT use a root `railway.json` with a hardcoded
`dockerfilePath` — it applies to every service in the project and would make all services
build the same image. Instead each service sets `RAILWAY_DOCKERFILE_PATH` to its own
Dockerfile, and the Dockerfile's `CMD` provides the start command. The api Dockerfile CMD
runs `prisma migrate deploy` before serving; the worker does not run migrations.

## One-time setup

1. Create (or select) a **PayChain** project in the `cambobia` Railway workspace.
2. Add the **PostgreSQL** and **Redis** plugins.
3. Create each service from the GitHub repo `khengleng/PayChain`, setting that service's
   `RAILWAY_DOCKERFILE_PATH` per the table above (or `railway up` from the CLI).
4. Set the environment variables below.
5. Attach each service's domain per the table above.

### Attaching a custom domain

DNS for `cambobia.com` is hosted in **Google Cloud DNS**. Adding a domain is two steps —
Railway side, then DNS side:

```bash
railway domain --service paychain-developer developer.paychain.cambobia.com
```

That prints a CNAME target and a `_railway-verify` TXT record. Create both in the
`cambobia.com` zone, then confirm:

```bash
railway domain status <domain-id> --service paychain-developer
# want: Verified: yes / Certificate status: CERTIFICATE_STATUS_TYPE_VALID
```

Two gotchas: record names are relative to the zone (`developer.paychain`, not the FQDN), and
Cloud DNS needs a **trailing dot** on the CNAME value or it resolves relative to the zone. The
TXT record is what unblocks certificate issuance — without it the cert sits in
`VALIDATING_OWNERSHIP` and HTTPS never comes up.

## Required environment variables

Railway provides `PORT` automatically; every service honors it. Reference
`${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}` from the plugins.

### paychain-api and paychain-worker

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<32+ char secret>
KEY_ENCRYPTION_KEY=<32+ char secret>       # dev-grade KMS; replace with real KMS/HSM before any pilot (§0.6)
STELLAR_NETWORK=testnet                      # mainnet is gated (§0.2/§0.7); do NOT set to mainnet in M0
STELLAR_RPC_PRIMARY_URL=https://soroban-testnet.stellar.org
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org
```

### paychain-admin

```
NODE_ENV=production
PAYCHAIN_API_URL=https://api.paychain.cambobia.com
ADMIN_CLIENT_ID=<api client id for the admin console>
ADMIN_CLIENT_SECRET=<api client secret>
```

### paychain-developer

```
NODE_ENV=production
PAYCHAIN_API_URL=https://api.paychain.cambobia.com
```

The developer portal is a public docs site with no auth and no credentials of its own. It calls
the API only for the unauthenticated health reads behind its `/status` page, so `PAYCHAIN_API_URL`
is the whole configuration surface. Both portals default to `https://api.paychain.cambobia.com`
in code, so this is an explicitness measure rather than a strict requirement.

Never set real secrets in the repo or in staging shared with production (§39).

## Deploy flow

Workflow: **push to GitHub → Railway builds and deploys.** If the repo is connected to the
Railway service, every push to the deploy branch triggers a build. The api container runs
`prisma migrate deploy` before serving, so schema changes ship with the code.

Health check: `GET /api/v1/health` (also `/health/ready`, `/health/blockchain`). Only the api
runs migrations — the worker and both portals do not.

Smoke-check the public surfaces after a deploy:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://api.paychain.cambobia.com/api/v1/health
curl -sS -o /dev/null -w '%{http_code}\n' https://developer.paychain.cambobia.com
curl -sS -o /dev/null -w '%{http_code}\n' https://paychain.cambobia.com
```

## Provisioning API clients

`pnpm --filter @paychain/database exec prisma db seed` creates a sandbox tenant + API client
(`demo-client` / `demo-secret` unless `SEED_CLIENT_ID`/`SEED_CLIENT_SECRET` are set). Do not
seed demo credentials into production.

**There is currently no self-service or admin flow for issuing API clients.** `POST
/api/v1/oauth/token` verifies `client_id`/`client_secret` against the `api_clients` table, but
nothing in the product writes to that table — the seed script is the only writer. Production
clients (including the admin console's own `ADMIN_CLIENT_ID`) are provisioned by inserting rows
directly. Two consequences worth tracking:

- The developer portal documents client-credentials auth it cannot hand out, so an external
  developer landing on `developer.paychain.cambobia.com` cannot self-onboard.
- Client secrets are hashed with unsalted SHA-256 (`apps/api/src/auth/auth.service.ts`). That is
  acceptable for a seeded placeholder but must be replaced with a slow KDF before real
  credentials are issued to third parties.

## Rollback

Use Railway's deployment history to redeploy the previous image. Because migrations are
additive (§0.4), a code rollback is safe; a schema rollback (rare) uses a new
forward migration, never a destructive down-migration on financial tables.
