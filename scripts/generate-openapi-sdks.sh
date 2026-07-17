#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SPEC_FILE="${1:-/tmp/paychain-openapi.json}"

cd "$ROOT"

pnpm dlx tsx -e "import { buildOpenApiSpec } from './apps/api/src/docs/openapi.ts'; console.log(JSON.stringify(buildOpenApiSpec(), null, 2));" > "$SPEC_FILE"

npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g dart-dio \
  -o "$ROOT/packages/sdk-dart" \
  --skip-validate-spec \
  --additional-properties=pubName=paychain_sdk,pubVersion=0.1.0,pubDescription=PayChain%20Dart%20SDK,sourceFolder=lib,enumUnknownDefaultCase=true

npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g php-nextgen \
  -o "$ROOT/packages/sdk-php" \
  --skip-validate-spec \
  --additional-properties=packageName=PayChainSdk,composerPackageName=paychain/sdk-php,artifactVersion=0.1.0,invokerPackage=PayChainSdk,variableNamingConvention=camelCase

npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g kotlin \
  -o "$ROOT/packages/sdk-kotlin" \
  --skip-validate-spec \
  --additional-properties=packageName=com.paychain.sdk,artifactId=paychain-sdk-kotlin,artifactVersion=0.1.0,packageVersion=0.1.0,groupId=com.paychain,library=jvm-okhttp4,dateLibrary=java8,serializationLibrary=moshi,sourceFolder=src/main/kotlin

npx @openapitools/openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g csharp \
  -o "$ROOT/packages/sdk-dotnet" \
  --skip-validate-spec \
  --additional-properties=packageName=PayChain.Sdk,packageVersion=0.1.0,targetFramework=net8.0,nullableReferenceTypes=true,useDateTimeOffset=true,sourceFolder=src
