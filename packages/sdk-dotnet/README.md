# PayChain .NET SDK

Generated .NET client source for the PayChain public API.

## Source

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-dotnet`
- Generation source: OpenAPI Generator `csharp`

## Status

This package is generated from the PayChain OpenAPI contract and committed to the repository for
.NET integrations.

## Local Use

The generated solution is in:

- `PayChain.Sdk.sln`
- `src/PayChain.Sdk`
- `src/PayChain.Sdk.Test`

Build and test it in a .NET 8 environment:

```bash
dotnet test packages/sdk-dotnet/PayChain.Sdk.sln
```

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `activateStablecoin`, `createRedemptionRequest`, and `getOpenApiContract`.

Detailed generated endpoint docs live in [`docs/`](./docs).
