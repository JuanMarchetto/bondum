#!/bin/bash
# Build verification script — ensures the app compiles without errors
# Run before submission to catch any build issues

set -euo pipefail

LOG_FILE="/home/marche/bondum-mobile/scripts/build-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
cd /home/marche/bondum-mobile

log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

PASS=0
FAIL=0

# 1. TypeScript check (app)
log "Running TypeScript check..."
if npx tsc --noEmit 2>&1 | grep -c "error TS" | grep -q "^0$"; then
  log "PASS: No TypeScript errors in app code"
  ((PASS++))
else
  ERRORS=$(npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -10)
  log "WARN: TypeScript errors found (may be non-blocking):"
  log "$ERRORS"
  ((FAIL++))
fi

# 2. Server syntax check
log "Checking server compiles..."
if cd server && npx tsx --eval "import './index'" 2>&1 | grep -q "running on"; then
  log "PASS: Server starts successfully"
  ((PASS++))
else
  log "FAIL: Server failed to start"
  ((FAIL++))
fi
cd /home/marche/bondum-mobile

# 3. Check all key files exist
KEY_FILES=(
  "server/index.ts"
  "src/app/scan/index.tsx"
  "src/app/(tabs)/(home)/index.tsx"
  "src/app/(tabs)/(rewards)/index.tsx"
  "src/app/(tabs)/(rewards)/[id].tsx"
  "src/services/rewardApi.ts"
  "src/hooks/useStreak.ts"
  "src/services/streakStorage.ts"
)
ALL_EXIST=true
for f in "${KEY_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    log "FAIL: Missing file $f"
    ALL_EXIST=false
    ((FAIL++))
  fi
done
if $ALL_EXIST; then
  log "PASS: All key files present"
  ((PASS++))
fi

# 4. Check for console.error or TODO in modified files
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" src/app/ src/services/rewardApi.ts src/hooks/useStreak.ts 2>/dev/null | grep -v node_modules | head -5 || true)
if [ -z "$TODOS" ]; then
  log "PASS: No TODOs/FIXMEs in key files"
  ((PASS++))
else
  log "INFO: Found TODOs (review before submission):"
  log "$TODOS"
fi

log "---"
log "Build check results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
