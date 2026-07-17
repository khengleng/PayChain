# PayChain Dart SDK

Generated Dart client for the PayChain public API.

## Source

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-dart`
- Generation source: OpenAPI Generator `dart-dio`

## Status

This package is generated from the PayChain OpenAPI contract and committed to the repository so
Flutter and Dart integrations do not need to generate a client from scratch before starting.

## Local Use

Add the package from this repository path:

```yaml
dependencies:
  paychain_sdk:
    path: ../PayChain/packages/sdk-dart
```

Then run:

```bash
dart pub get
dart run build_runner build
dart analyze
```

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `issueAsset`, `createWebhook`, and `getOpenApiContract`.

Detailed generated endpoint docs live in [`doc/`](./doc).
