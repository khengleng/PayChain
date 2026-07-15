# PayChain Developer Portal (Next.js) — Railway-deployable. Build context = repo ROOT.
#   docker build -f apps/developer-portal/Dockerfile .
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @paychain/developer-portal build

EXPOSE 3000
CMD ["pnpm", "--filter", "@paychain/developer-portal", "start"]
