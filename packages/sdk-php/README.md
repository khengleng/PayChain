# PayChain PHP SDK

Generated PHP client source for the PayChain public API.

This SDK is proprietary to PayChain and is intended for approved partner and internal use.

## Contract

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-php`

This package is generated from the PayChain OpenAPI contract for PHP server integrations.

## Local Use

Use the package from this workspace for development, or distribute it through a PayChain-approved
private Composer repository:

```bash
cd packages/sdk-php
composer install
```

Then reference the namespace `PayChainSdk\\...` from your application.

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `issueAsset`, `createWebhook`, and `approveCompensation`.

Detailed generated endpoint docs live in [`docs/`](./docs).
