# PayChain .NET SDK

Generated .NET client source for the PayChain public API.

This SDK is proprietary to PayChain and is intended for approved partner and internal use.

## Contract

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-dotnet`

This package is generated from the PayChain OpenAPI contract for .NET integrations.

## Local Use

The generated solution is in:

- `PayChain.Sdk.sln`
- `src/PayChain.Sdk`
- `src/PayChain.Sdk.Test`

Build and test it in a .NET 8 environment:

```bash
dotnet test packages/sdk-dotnet/PayChain.Sdk.sln
```

Distribute built packages through a PayChain-controlled private NuGet feed.

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `activateStablecoin`, `createRedemptionRequest`, and `getOpenApiContract`.

Detailed generated endpoint docs live in [`docs/`](./docs).
