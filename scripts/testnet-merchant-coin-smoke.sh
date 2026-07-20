#!/usr/bin/env bash
#
# Testnet smoke test: PayKH merchant issues a reserve-backed stablecoin (branded as points),
# PayChain mints it to a customer wallet. Exercises the full client-facing flow end-to-end.
#
# This drives the API-CLIENT steps (provision → activate → reserve → wallet → mint). The one-time
# ADMIN prerequisites (create the tenant, issue the two client credentials, enable the flags) are
# in docs/integration/merchant-coin-testnet-runbook.md — do those in the admin portal first.
#
# Maker-checker: PayChain refuses self-approval on lifecycle gates, reserve movements, and mint
# approval, so this needs TWO client credentials — a MAKER (requests) and a CHECKER (approves),
# each granted the sensitive scopes (both require an ownerEmail at issuance).
#
#   MAKER scopes:   stablecoin.provision stablecoin.manage reserve.manage wallet.write
#                   stablecoin.read reserve.read wallet.read
#   CHECKER scopes: stablecoin.approve reserve.approve stablecoin.read reserve.read
#
# Usage:
#   BASE_URL=https://api.paychain.cambobia.com \
#   MAKER_ID=... MAKER_SECRET=... CHECKER_ID=... CHECKER_SECRET=... \
#   ./scripts/testnet-merchant-coin-smoke.sh
#
# Requires: bash, curl, jq. Targets TESTNET only.
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.paychain.cambobia.com}"
API="${BASE_URL%/}/api/v1"
ASSET_CODE="${ASSET_CODE:-PKH$RANDOM}"          # unique per run so re-runs don't collide
ASSET_NAME="${ASSET_NAME:-PayKH Points}"
REFERENCE_CURRENCY="${REFERENCE_CURRENCY:-USD}"  # USD avoids the KHR legal-gate constraint
UNIT_VALUE="${UNIT_VALUE:-0.01}"                 # 1 coin = $0.01
BRAND_LABEL="${BRAND_LABEL:-PayKH Rewards}"
MERCHANT_REF="${MERCHANT_REF:-merchant-smoke-$RANDOM}"
MINT_AMOUNT="${MINT_AMOUNT:-500}"
RESERVE_AMOUNT="${RESERVE_AMOUNT:-100000}"       # comfortably covers supply × unitValue × target
CUSTOMER_REF="${CUSTOMER_REF:-cust-smoke-$RANDOM}"

: "${MAKER_ID:?set MAKER_ID}"; : "${MAKER_SECRET:?set MAKER_SECRET}"
: "${CHECKER_ID:?set CHECKER_ID}"; : "${CHECKER_SECRET:?set CHECKER_SECRET}"

log()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
idem() { echo "smoke-$(date +%s)-$RANDOM"; }

token() { # client_id client_secret -> access_token
  curl -fsS -X POST "$API/oauth/token" -H 'Content-Type: application/json' \
    -d "{\"grant_type\":\"client_credentials\",\"client_id\":\"$1\",\"client_secret\":\"$2\"}" \
    | jq -r '.access_token'
}

# call TOKEN METHOD PATH [JSON_BODY] [idempotent]  -> prints response body, fails on non-2xx
call() {
  local tok="$1" method="$2" path="$3" body="${4:-}" idempotent="${5:-}"
  local args=(-sS -X "$method" "$API$path" -H "Authorization: Bearer $tok")
  [[ -n "$idempotent" ]] && args+=(-H "Idempotency-Key: $(idem)")
  [[ -n "$body" ]] && args+=(-H 'Content-Type: application/json' -d "$body")
  local out code
  out=$(curl "${args[@]}" -w $'\n%{http_code}')
  code="${out##*$'\n'}"; out="${out%$'\n'*}"
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    fail "$method $path -> HTTP $code: $out"
  fi
  echo "$out"
}

log "Authenticating maker + checker"
MAKER_TOK=$(token "$MAKER_ID" "$MAKER_SECRET");   [[ -n "$MAKER_TOK" && "$MAKER_TOK" != null ]]   || fail "maker token"
CHECKER_TOK=$(token "$CHECKER_ID" "$CHECKER_SECRET"); [[ -n "$CHECKER_TOK" && "$CHECKER_TOK" != null ]] || fail "checker token"

log "Provisioning merchant coin $ASSET_CODE ($REFERENCE_CURRENCY, 1 coin = $UNIT_VALUE)"
COIN=$(call "$MAKER_TOK" POST /stablecoins/provision-merchant \
  "{\"assetCode\":\"$ASSET_CODE\",\"assetName\":\"$ASSET_NAME\",\"referenceCurrency\":\"$REFERENCE_CURRENCY\",\"unitValue\":\"$UNIT_VALUE\",\"brandLabel\":\"$BRAND_LABEL\",\"merchantReference\":\"$MERCHANT_REF\"}" idem)
COIN_ID=$(echo "$COIN" | jq -r '.id')          # stablecoinConfig id — used by lifecycle/reserve/mint routes
ASSET_ID=$(echo "$COIN" | jq -r '.assetId')
echo "  coin id=$COIN_ID assetId=$ASSET_ID state=$(echo "$COIN" | jq -r '.lifecycleState')"

log "Driving lifecycle DRAFT → ACTIVE (maker advances, checker approves each gate)"
call "$MAKER_TOK" POST "/stablecoins/$COIN_ID/submit-for-review" >/dev/null
declare -A NEXT_STATE=(
  [LEGAL]=COMPLIANCE_REVIEW [COMPLIANCE]=TREASURY_REVIEW [TREASURY]=RESERVE_PENDING
  [RESERVE]=TECHNICAL_TESTING [TECHNICAL]=PILOT_APPROVED [PILOT]=""
)
for GATE in LEGAL COMPLIANCE TREASURY RESERVE TECHNICAL PILOT; do
  call "$CHECKER_TOK" POST "/stablecoins/$COIN_ID/approve-gate" "{\"gate\":\"$GATE\"}" >/dev/null
  echo "  approved gate $GATE"
  NEXT="${NEXT_STATE[$GATE]}"
  [[ -n "$NEXT" ]] && call "$MAKER_TOK" POST "/stablecoins/$COIN_ID/advance" "{\"toState\":\"$NEXT\"}" >/dev/null
done
STATE=$(call "$CHECKER_TOK" POST "/stablecoins/$COIN_ID/activate" | jq -r '.lifecycleState')
[[ "$STATE" == ACTIVE ]] || fail "coin did not reach ACTIVE (state=$STATE)"
echo "  coin is ACTIVE"

log "Reserve: register account, fund (maker), approve (checker), snapshot"
RES_ACCT=$(call "$MAKER_TOK" POST "/stablecoins/$COIN_ID/reserve-accounts" '{"label":"Smoke custody"}' | jq -r '.id')
MOVE_ID=$(call "$MAKER_TOK" POST /reserve/movements \
  "{\"reserveAccountId\":\"$RES_ACCT\",\"direction\":\"CREDIT\",\"amount\":\"$RESERVE_AMOUNT\"}" | jq -r '.id')
call "$CHECKER_TOK" POST "/reserve/movements/$MOVE_ID/approve" >/dev/null
call "$MAKER_TOK" POST "/stablecoins/$COIN_ID/reserve-snapshots" >/dev/null   # required by assertFresh before minting
echo "  reserve funded ($RESERVE_AMOUNT) + snapshotted"

log "Creating customer wallet ($CUSTOMER_REF)"
CUST_WALLET=$(call "$MAKER_TOK" POST /wallets "{\"ownerType\":\"CUSTOMER\",\"ownerReference\":\"$CUSTOMER_REF\"}" idem)
CUST_ID=$(echo "$CUST_WALLET" | jq -r '.id')
echo "  wallet id=$CUST_ID account=$(echo "$CUST_WALLET" | jq -r '.stellarAccountId') status=$(echo "$CUST_WALLET" | jq -r '.status')"

log "Minting $MINT_AMOUNT $ASSET_CODE to the customer (reserve-gated)"
MINT_ID=$(call "$MAKER_TOK" POST "/stablecoins/$COIN_ID/mint-requests" \
  "{\"destinationWalletId\":\"$CUST_ID\",\"amount\":\"$MINT_AMOUNT\",\"fundingReference\":\"FUND-smoke-$RANDOM\"}" idem | jq -r '.id')
# Advance the saga; approve as the checker at APPROVAL_REQUIRED; stop at RECONCILED/terminal.
for _ in $(seq 1 10); do
  ST=$(call "$MAKER_TOK" GET "/mint-requests/$MINT_ID" | jq -r '.status')
  echo "  mint status: $ST"
  case "$ST" in
    RECONCILED) break;;
    REJECTED|FAILED) fail "mint ended $ST";;
    APPROVAL_REQUIRED) call "$CHECKER_TOK" POST "/mint-requests/$MINT_ID/approve" >/dev/null;;
    *) call "$MAKER_TOK" POST "/mint-requests/$MINT_ID/advance" >/dev/null;;
  esac
done

log "Done. Customer balance:"
call "$MAKER_TOK" GET "/wallets/$CUST_ID/balances" | jq '.'
echo
echo "✓ Issued $MINT_AMOUNT $ASSET_CODE to $CUSTOMER_REF. This is a reserve-backed stablecoin branded as \"$BRAND_LABEL\"."
