# PayChain TypeScript SDK

Hand-written TypeScript client for the PayChain public API.

## Features

- OAuth client-credentials token caching
- Automatic idempotency keys for replay-safe writes
- Retries with backoff for transient failures
- Typed errors
- Webhook signature verification helpers

## Build

```bash
pnpm --filter @paychain/sdk build
pnpm --filter @paychain/sdk test
```

## Package

```bash
cd packages/sdk-typescript
npm pack
```
