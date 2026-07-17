# PayChain PHP SDK

Generated PHP client source for the PayChain public API.

## Source

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-php`
- Generation source: OpenAPI Generator `php-nextgen`

## Status

This package is generated from the PayChain OpenAPI contract and committed to the repository for
PHP server integrations.

## Local Use

Use the package directly from this repository until it is published to a package registry:

```bash
cd packages/sdk-php
composer install
```

Then reference the namespace `PayChainSdk\\...` from your application.

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `issueAsset`, `createWebhook`, and `approveCompensation`.

Detailed generated endpoint docs live in [`docs/`](./docs).
