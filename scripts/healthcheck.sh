#!/bin/bash
# Healthcheck script — runs periodically to verify server + app are working
# Usage: called by cron or manually

set -euo pipefail

LOG_FILE="/home/marche/bondum-mobile/scripts/healthcheck.log"
API_URL="${REWARD_API_URL:-https://api.bondum.xyz}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

PASS=0
FAIL=0

# 1. Check reward catalog endpoint
if curl -sf "$API_URL/rewards" | grep -q '"rewards"'; then
  log "PASS: GET /rewards returns catalog"
  ((PASS++))
else
  log "FAIL: GET /rewards not responding"
  ((FAIL++))
fi

# 2. Check streak endpoint (dummy address)
if curl -sf "$API_URL/streak/11111111111111111111111111111111" | grep -q '"currentStreak"'; then
  log "PASS: GET /streak/:address returns streak data"
  ((PASS++))
else
  log "FAIL: GET /streak/:address not responding"
  ((FAIL++))
fi

# 3. Check daily challenge endpoint
if curl -sf "$API_URL/daily-challenge" | grep -q '"description"'; then
  log "PASS: GET /daily-challenge returns challenge"
  ((PASS++))
else
  log "FAIL: GET /daily-challenge not responding"
  ((FAIL++))
fi

# 4. Check AI recommendation endpoint
if curl -sf -X POST "$API_URL/ai/recommend" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"11111111111111111111111111111111","streak":0,"balance":0}' | grep -q '"recommendation"'; then
  log "PASS: POST /ai/recommend returns recommendation"
  ((PASS++))
else
  log "FAIL: POST /ai/recommend not responding"
  ((FAIL++))
fi

# 5. Check redeem/request endpoint validation
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" -X POST "$API_URL/redeem/request" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"test"}' 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "400" ]; then
  log "PASS: POST /redeem/request validates input (400 on missing fields)"
  ((PASS++))
else
  log "FAIL: POST /redeem/request returned $HTTP_CODE instead of 400"
  ((FAIL++))
fi

# 6. Verify PaniCafe rewards in catalog
if curl -sf "$API_URL/rewards?brand=PaniCafe" | grep -q '"pc-5"'; then
  log "PASS: PaniCafe real products (pc-5 Free Café) in catalog"
  ((PASS++))
else
  log "FAIL: PaniCafe real products not found in catalog"
  ((FAIL++))
fi

log "---"
log "Results: $PASS passed, $FAIL failed out of $((PASS + FAIL)) checks"

if [ "$FAIL" -gt 0 ]; then
  log "ACTION REQUIRED: $FAIL checks failed. Server may need restart or deployment."
  exit 1
fi

log "All checks passed."
exit 0
