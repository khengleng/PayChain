#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-}"
OUTDIR="${2:-$ROOT/release-assets}"

if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <version> [output-dir]" >&2
  exit 1
fi

bash "$ROOT/scripts/verify-sdk-versions.sh" "$VERSION"

rm -rf "$OUTDIR"
mkdir -p "$OUTDIR"

pnpm --filter @paychain/sdk build
npm pack "$ROOT/packages/sdk-typescript" --pack-destination "$OUTDIR" >/dev/null
cp "$OUTDIR/paychain-sdk-$VERSION.tgz" "$OUTDIR/paychain-sdk-latest.tgz"

(
  cd "$ROOT/packages/sdk-dart"
  dart pub get
  dart run build_runner build
  tar --exclude='.dart_tool' --exclude='build' -czf "$OUTDIR/paychain-sdk-dart-$VERSION.tar.gz" .
)
cp "$OUTDIR/paychain-sdk-dart-$VERSION.tar.gz" "$OUTDIR/paychain-sdk-dart-latest.tar.gz"

(
  cd "$ROOT/packages/sdk-php"
  composer validate --no-check-publish
  composer install --no-interaction --prefer-dist
  composer test
  tar --exclude='vendor' -czf "$OUTDIR/paychain-sdk-php-$VERSION.tar.gz" .
)
cp "$OUTDIR/paychain-sdk-php-$VERSION.tar.gz" "$OUTDIR/paychain-sdk-php-latest.tar.gz"

(
  cd "$ROOT/packages/sdk-kotlin"
  chmod +x gradlew
  ./gradlew test jar sourcesJar
  cp "build/libs/paychain-sdk-kotlin-$VERSION.jar" "$OUTDIR/"
  cp "build/libs/paychain-sdk-kotlin-$VERSION-sources.jar" "$OUTDIR/"
)
cp "$OUTDIR/paychain-sdk-kotlin-$VERSION.jar" "$OUTDIR/paychain-sdk-kotlin-latest.jar"
cp "$OUTDIR/paychain-sdk-kotlin-$VERSION-sources.jar" "$OUTDIR/paychain-sdk-kotlin-latest-sources.jar"

dotnet test "$ROOT/packages/sdk-dotnet/PayChain.Sdk.sln" --configuration Release
dotnet pack "$ROOT/packages/sdk-dotnet/src/PayChain.Sdk/PayChain.Sdk.csproj" --configuration Release -p:PackageVersion="$VERSION" -o "$OUTDIR"
cp "$OUTDIR/PayChain.Sdk.$VERSION.nupkg" "$OUTDIR/PayChain.Sdk.latest.nupkg"
if [[ -f "$OUTDIR/PayChain.Sdk.$VERSION.snupkg" ]]; then
  cp "$OUTDIR/PayChain.Sdk.$VERSION.snupkg" "$OUTDIR/PayChain.Sdk.latest.snupkg"
fi
