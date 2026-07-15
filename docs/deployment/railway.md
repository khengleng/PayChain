# Railway Deployment (M0)

PayChain deploys on Railway. The M0 deployable is the **paychain-api** service, built from
`apps/api/Dockerfile` (build context = repo root). Production URL: **paychain.cambobia.com**.

## Services

| Service | Source | Notes |
|---|---|---|
| paychain-api | `apps/api/Dockerfile` | NestJS API, runs `prisma migrate deploy` on start |
| paychain-postgres | Railway plugin | Managed PostgreSQL |
| paychain-redis | Railway plugin | Managed Redis (declared now; used from M1) |

Worker, admin, and developer-portal services arrive in later milestones.

## One-time setup

1. Create (or select) a **PayChain** project in the `cambobia` Railway workspace.
2. Add the **PostgreSQL** and **Redis** plugins.
3. Create the **paychain-api** service from the GitHub repo `khengleng/PayChain`
   (Dockerfile builder, path `apps/api/Dockerfile`), or `railway up` from the CLI.
4. Set the environment variables below.
5. Attach the domain `paychain.cambobia.com` to the api service.

## Required environment variables

Railway provides `PORT` automatically; the API honors it. Reference `${{Postgres.DATABASE_URL}}`
and `${{Redis.REDIS_URL}}` from the plugins.

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

Never set real secrets in the repo or in staging shared with production (§39).

## Deploy flow

Workflow: **push to GitHub → Railway builds and deploys.** If the repo is connected to the
Railway service, every push to the deploy branch triggers a build. The container runs
`prisma migrate deploy` before serving, so schema changes ship with the code.

Health check: `GET /api/v1/health` (also `/health/ready`, `/health/blockchain`).

## Seeding a demo client (non-production)

`pnpm --filter @paychain/database exec prisma db seed` creates a sandbox tenant + API
client. Do not seed demo credentials into production.

## Rollback

Use Railway's deployment history to redeploy the previous image. Because migrations are
additive (§0.4), a code rollback is safe; a schema rollback (rare) uses a new
forward migration, never a destructive down-migration on financial tables.
