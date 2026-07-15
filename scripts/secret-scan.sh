#!/usr/bin/env bash
# Lightweight secret scan (§41). Fails CI if obvious secrets are committed to source.
# This is a backstop; production should also run a dedicated scanner (gitleaks/trufflehog).
set -euo pipefail

# Patterns for high-signal secrets. Stellar secret seeds start with 'S' + 55 base32 chars.
patterns=(
  'S[A-Z2-7]{55}'                 # Stellar secret seed
  '-----BEGIN [A-Z ]*PRIVATE KEY' # PEM private key
  'xox[baprs]-[0-9A-Za-z-]{10,}'  # Slack token
  'AKIA[0-9A-Z]{16}'              # AWS access key id
)

# Only scan tracked source; exclude tests/fixtures, docs, lockfiles, and this script.
files=$(git ls-files \
  | grep -Ev '(^|/)(node_modules|dist|\.next)/' \
  | grep -Ev '\.(md|lock|yaml|yml)$' \
  | grep -Ev '(secret-scan\.sh|\.spec\.ts$|\.e2e-spec\.ts$)' \
  | grep -Ev '(seed\.ts|\.env\.example)$' || true)

found=0
for pat in "${patterns[@]}"; do
  if [ -n "$files" ] && echo "$files" | xargs grep -lE "$pat" 2>/dev/null; then
    echo "::error::Potential secret matching /$pat/ found above"
    found=1
  fi
done

if [ "$found" -ne 0 ]; then
  echo "Secret scan failed."
  exit 1
fi
echo "Secret scan passed."
