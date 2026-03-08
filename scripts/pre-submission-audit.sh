#!/bin/bash
# Pre-submission audit — comprehensive check before hackathon submission
# Run this 2-3 hours before deadline

set -euo pipefail

cd /home/marche/bondum-mobile
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "  BONDUM PRE-SUBMISSION AUDIT"
echo "  $TIMESTAMP"
echo "=========================================="
echo ""

# 1. Git status
echo "--- GIT STATUS ---"
BRANCH=$(git branch --show-current)
echo "Branch: $BRANCH"
UNCOMMITTED=$(git status --porcelain | wc -l)
echo "Uncommitted changes: $UNCOMMITTED"
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "WARNING: You have uncommitted changes!"
  git status --short
fi
echo ""

# 2. Feature checklist
echo "--- FEATURE CHECKLIST ---"
check_feature() {
  if grep -q "$2" "$3" 2>/dev/null; then
    echo "  [x] $1"
  else
    echo "  [ ] $1 (MISSING)"
  fi
}

check_feature "Helius RPC" "helius-rpc.com" "server/index.ts"
check_feature "Priority fees" "getPriorityFeeEstimate" "server/index.ts"
check_feature "Send-and-confirm retry" "sendAndConfirmWithRetry" "server/index.ts"
check_feature "2-step redemption endpoint" "/redeem/request" "server/index.ts"
check_feature "Streak tracking" "streakStore" "server/index.ts"
check_feature "Streak milestones" "STREAK_MILESTONES" "server/index.ts"
check_feature "Daily challenges" "daily-challenge" "server/index.ts"
check_feature "AI recommendations" "/ai/recommend" "server/index.ts"
check_feature "PaniCafe real products" "pc-9" "server/index.ts"
check_feature "Client 2-step redemption" "requestRedemption" "src/app/(tabs)/(rewards)/[id].tsx"
check_feature "Wallet signing (MWA)" "mobileWallet" "src/app/(tabs)/(rewards)/[id].tsx"
check_feature "Wallet signing (Privy)" "embeddedSolanaWallet" "src/app/(tabs)/(rewards)/[id].tsx"
check_feature "Scan error handling (no silent fallback)" "Claim Failed" "src/app/scan/index.tsx"
check_feature "Streak multiplier UI" "multiplier" "src/app/(tabs)/(home)/index.tsx"
check_feature "AI insight card" "aiRecommendation" "src/app/(tabs)/(home)/index.tsx"
check_feature "Daily challenge card" "dailyChallenge" "src/app/(tabs)/(home)/index.tsx"
check_feature "Server streak sync" "serverStreak" "src/hooks/useStreak.ts"
check_feature "Post-scan streak feedback" "streakInfo" "src/app/scan/index.tsx"
check_feature "PaniCafe offline catalog" "pc-5" "src/services/rewardApi.ts"
echo ""

# 3. Endpoint count
echo "--- SERVER ENDPOINTS ---"
ENDPOINTS=$(grep -c "url.pathname" server/index.ts)
echo "Total route handlers: $ENDPOINTS"
echo ""

# 4. Reward catalog count
echo "--- REWARD CATALOG ---"
REWARDS=$(grep -c "id: 'pc-\|id: '" server/index.ts)
echo "Total rewards in catalog: $REWARDS"
echo ""

# 5. Lines of code changed
echo "--- CODE CHANGES FROM MAIN ---"
git diff main --stat 2>/dev/null || git diff HEAD~5 --stat
echo ""

echo "=========================================="
echo "  AUDIT COMPLETE"
echo "=========================================="
