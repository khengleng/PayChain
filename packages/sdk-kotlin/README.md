# PayChain Kotlin SDK

Generated Kotlin/JVM client for the PayChain public API.

This SDK is proprietary to PayChain and is intended for approved partner and internal use.

## Contract

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-kotlin`

This package is generated from the PayChain OpenAPI contract for Android and JVM integrations.

## Local Use

```bash
cd packages/sdk-kotlin
chmod +x gradlew
./gradlew test
```

Distribute artifacts through a PayChain-controlled private Maven repository.

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `quoteConversion`, `listTransactions`, and `rotateWebhookSecret`.

Detailed generated endpoint docs live in [`docs/`](./docs).
