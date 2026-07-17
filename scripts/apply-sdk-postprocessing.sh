#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cat > "$ROOT/packages/sdk-dart/README.md" <<'EOF'
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
EOF

cat > "$ROOT/packages/sdk-dart/pubspec.yaml" <<'EOF'
name: paychain_sdk
version: 0.1.0
description: PayChain Dart SDK for the public API
homepage: https://developer.paychain.cambobia.com
repository: https://github.com/khengleng/PayChain
issue_tracker: https://github.com/khengleng/PayChain/issues

environment:
  sdk: '>=2.18.0 <4.0.0'

dependencies:
  dio: '^5.7.0'
  one_of: '>=1.5.0 <2.0.0'
  one_of_serializer: '>=1.5.0 <2.0.0'
  built_value: '>=8.4.0 <9.0.0'
  built_collection: '>=5.1.1 <6.0.0'

dev_dependencies:
  built_value_generator: '>=8.4.0 <9.0.0'
  build_runner: any
  test: '^1.16.0'
EOF

cat > "$ROOT/packages/sdk-dart/analysis_options.yaml" <<'EOF'
analyzer:
  language:
    strict-inference: true
    strict-raw-types: true
    strict-casts: false
  exclude:
    - test/*.dart
  errors:
    deprecated_member_use_from_same_package: ignore
    duplicate_import: ignore
    unused_element_parameter: ignore
    unused_import: ignore
EOF

cat > "$ROOT/packages/sdk-php/README.md" <<'EOF'
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
EOF

cat > "$ROOT/packages/sdk-php/composer.json" <<'EOF'
{
    "name": "paychain/sdk-php",
    "version": "0.1.0",
    "description": "Generated PHP SDK for the PayChain public API.",
    "type": "library",
    "keywords": [
        "paychain",
        "sdk",
        "php",
        "openapi",
        "api"
    ],
    "homepage": "https://developer.paychain.cambobia.com",
    "license": "Apache-2.0",
    "authors": [
        {
            "name": "PayChain",
            "homepage": "https://developer.paychain.cambobia.com"
        }
    ],
    "support": {
        "issues": "https://github.com/khengleng/PayChain/issues",
        "source": "https://github.com/khengleng/PayChain"
    },
    "require": {
        "php": "^8.1",
        "ext-curl": "*",
        "ext-json": "*",
        "ext-mbstring": "*",
        "guzzlehttp/guzzle": "^7.4.5",
        "guzzlehttp/psr7": "^2.0"
    },
    "require-dev": {
        "friendsofphp/php-cs-fixer": "^3.5",
        "overtrue/phplint": "^9.0",
        "phpunit/phpunit": "^9.0"
    },
    "autoload": {
        "psr-4": {
            "PayChainSdk\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "PayChainSdk\\Test\\": "tests/"
        }
    },
    "scripts": {
        "test": [
            "@phplint"
        ],
        "phplint": "phplint"
    }
}
EOF

cat > "$ROOT/packages/sdk-kotlin/README.md" <<'EOF'
# PayChain Kotlin SDK

Generated Kotlin/JVM client for the PayChain public API.

## Source

- OpenAPI contract: `https://api.paychain.cambobia.com/api/v1/openapi.json`
- Package path: `packages/sdk-kotlin`
- Generation source: OpenAPI Generator `kotlin` with `jvm-okhttp4`

## Status

This package is generated from the PayChain OpenAPI contract and committed to the repository for
Android and JVM integrations.

## Local Use

```bash
cd packages/sdk-kotlin
chmod +x gradlew
./gradlew test
```

## Contract

Generated method names come from explicit operation IDs in the PayChain contract, for example
`createWallet`, `quoteConversion`, `listTransactions`, and `rotateWebhookSecret`.

Detailed generated endpoint docs live in [`docs/`](./docs).
EOF

perl -0pi -e "s/group 'com\\.paychain'\\nversion '0\\.1\\.0'\\n/group 'com.paychain'\\nversion '0.1.0'\\ndescription = 'PayChain Kotlin SDK for the public API'\\n/" "$ROOT/packages/sdk-kotlin/build.gradle"
perl -0pi -e "s/publications \\{\\n        maven\\(MavenPublication\\) \\{\\n            groupId = 'com\\.paychain'\\n            artifactId = 'paychain-sdk-kotlin'\\n            version = '0\\.1\\.0'\\n            from components\\.java\\n        \\}\\n    \\}/publications {\\n        maven(MavenPublication) {\\n            groupId = 'com.paychain'\\n            artifactId = 'paychain-sdk-kotlin'\\n            version = '0.1.0'\\n            from components.java\\n\\n            pom {\\n                name = 'PayChain Kotlin SDK'\\n                description = 'Generated Kotlin SDK for the PayChain public API.'\\n                url = 'https:\\/\\/developer.paychain.cambobia.com'\\n\\n                licenses {\\n                    license {\\n                        name = 'Apache License, Version 2.0'\\n                        url = 'https:\\/\\/www.apache.org\\/licenses\\/LICENSE-2.0.txt'\\n                    }\\n                }\\n\\n                scm {\\n                    url = 'https:\\/\\/github.com\\/khengleng\\/PayChain'\\n                    connection = 'scm:git:https:\\/\\/github.com\\/khengleng\\/PayChain.git'\\n                    developerConnection = 'scm:git:https:\\/\\/github.com\\/khengleng\\/PayChain.git'\\n                }\\n            }\\n        }\\n    }/" "$ROOT/packages/sdk-kotlin/build.gradle"

cat > "$ROOT/packages/sdk-dotnet/README.md" <<'EOF'
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
EOF

perl -0pi -e "s#<Authors>OpenAPI</Authors>#<Authors>PayChain</Authors>#; s#<Company>OpenAPI</Company>#<Company>PayChain</Company>#; s#<AssemblyTitle>OpenAPI Library</AssemblyTitle>#<AssemblyTitle>PayChain SDK</AssemblyTitle>#; s#<Description>A library generated from a OpenAPI doc</Description>#<Description>Generated .NET SDK for the PayChain public API.</Description>#; s#<Copyright>No Copyright</Copyright>#<Copyright>Copyright PayChain</Copyright>#; s#<RepositoryUrl>https://github.com/GIT_USER_ID/GIT_REPO_ID.git</RepositoryUrl>#<RepositoryUrl>https://github.com/khengleng/PayChain</RepositoryUrl>#; s#<RepositoryType>git</RepositoryType>#<RepositoryType>git</RepositoryType>\\n    <PackageProjectUrl>https://developer.paychain.cambobia.com</PackageProjectUrl>\\n    <PackageLicenseExpression>Apache-2.0</PackageLicenseExpression>\\n    <PackageTags>paychain;api;sdk;openapi</PackageTags>#; s#<PackageReleaseNotes>Minor update</PackageReleaseNotes>#<PackageReleaseNotes>Generated from the PayChain public OpenAPI contract.</PackageReleaseNotes>#;" "$ROOT/packages/sdk-dotnet/src/PayChain.Sdk/PayChain.Sdk.csproj"

cat > "$ROOT/packages/sdk-typescript/README.md" <<'EOF'
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
EOF
