# PayChain Dart SDK

Generated Dart client for the PayChain public API.

This SDK is proprietary to PayChain and is intended for approved partner and internal use.

## Contract

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-dart`

This package is generated from the PayChain OpenAPI contract so Flutter and Dart integrations can
start from a maintained PayChain-owned client package.

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

Distribute releases through a PayChain-controlled private Dart/Flutter package channel.

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `issueAsset`, `createWebhook`, and `getOpenApiContract`.

Detailed generated endpoint docs live in [`doc/`](./doc).
