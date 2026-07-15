# PayChain Admin Portal (Next.js) — Railway-deployable. Build context = repo ROOT.
#   docker build -f apps/admin-portal/Dockerfile .
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @paychain/admin-portal build

EXPOSE 3000
CMD ["pnpm", "--filter", "@paychain/admin-portal", "start"]
