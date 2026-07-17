#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXPECTED_VERSION="${1:-}"

typescript_version="$(node -p "require('$ROOT/packages/sdk-typescript/package.json').version")"
dart_version="$(sed -n 's/^version: //p' "$ROOT/packages/sdk-dart/pubspec.yaml" | head -n 1)"
php_version="$(node -p "require('$ROOT/packages/sdk-php/composer.json').version")"
kotlin_version="$(sed -n "s/^version '\\(.*\\)'/\\1/p" "$ROOT/packages/sdk-kotlin/build.gradle" | head -n 1)"
dotnet_version="$(perl -ne 'print "$1\n" if /<Version>([^<]+)<\/Version>/' "$ROOT/packages/sdk-dotnet/src/PayChain.Sdk/PayChain.Sdk.csproj" | head -n 1)"

versions=(
  "typescript:$typescript_version"
  "dart:$dart_version"
  "php:$php_version"
  "kotlin:$kotlin_version"
  "dotnet:$dotnet_version"
)

reference_version="$typescript_version"

for entry in "${versions[@]}"; do
  name="${entry%%:*}"
  version="${entry#*:}"

  if [[ -z "$version" ]]; then
    echo "::error::$name SDK version is empty" >&2
    exit 1
  fi

  if [[ "$version" != "$reference_version" ]]; then
    echo "::error::SDK version mismatch for $name: expected $reference_version, found $version" >&2
    exit 1
  fi
done

if [[ -n "$EXPECTED_VERSION" && "$reference_version" != "$EXPECTED_VERSION" ]]; then
  echo "::error::SDK version mismatch for release: expected $EXPECTED_VERSION, found $reference_version" >&2
  exit 1
fi

echo "SDK versions aligned at $reference_version"
