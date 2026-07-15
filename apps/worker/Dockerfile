# PayChain Worker — Railway-deployable image (§39). Build context is the repo ROOT.
#   docker build -f apps/worker/Dockerfile .
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

COPY . .
# --prod=false: devDependencies (prisma, tsc) are needed to generate the client and build.
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @paychain/database exec prisma generate \
  && pnpm -r --filter "./packages/**" build \
  && pnpm --filter @paychain/worker build

# The worker does not run migrations (the api service owns migrate deploy).
CMD ["node", "apps/worker/dist/main.js"]
