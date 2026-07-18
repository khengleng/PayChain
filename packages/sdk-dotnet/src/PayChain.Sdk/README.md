# PayChain .NET SDK

Generated .NET client source for the PayChain public API.

This SDK is proprietary to PayChain and is intended for approved partner and internal use.

## Contract

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package name: `PayChain.Sdk`
- Target framework: `net8.0`

## Build

```bash
dotnet test packages/sdk-dotnet/PayChain.Sdk.sln
```

## Distribution

Distribute approved builds through a PayChain-controlled private NuGet feed.

## Security

Use this SDK only with PayChain-issued credentials and approved environments. Do not embed long-lived
client secrets in distributed applications.
