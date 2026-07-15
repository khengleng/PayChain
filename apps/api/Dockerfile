# PayChain API — Railway-deployable image (§39).
# Build context is the repo ROOT (the monorepo), not apps/api.
#   docker build -f apps/api/Dockerfile .
FROM node:20-bookworm-slim

# OpenSSL + CA certs are required by Prisma and TLS calls to Stellar/Horizon.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
RUN corepack enable

WORKDIR /app

# Copy the whole workspace (node_modules/dist excluded via .dockerignore) and install.
COPY . .
RUN pnpm install --frozen-lockfile

# Generate the Prisma client, then build packages (topo order) and the API.
RUN pnpm --filter @paychain/database exec prisma generate \
  && pnpm -r --filter "./packages/**" build \
  && pnpm --filter @paychain/api build

EXPOSE 3000

# Apply migrations before serving so the schema is always in sync on deploy.
CMD ["sh", "-c", "pnpm --filter @paychain/database exec prisma migrate deploy && node apps/api/dist/main.js"]
