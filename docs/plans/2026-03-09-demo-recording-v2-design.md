# Demo Recording v2 — Design

**Goal:** Record a polished ~2 min MP4 demo of Bondum via webreel + Expo Web, showcasing ALL app actions with mocked data (fake balances, NFTs, QR scan, coupon claim).

**Approach:** Webreel on Expo Web with `Platform.OS === 'web'` mocks. Zero impact on production app.

---

## What Gets Mocked

### 1. Secure Storage (blocker fix)
- `src/services/storage/secureStorage.ts` — wrap all `SecureStore.*` calls with `Platform.OS === 'web'` check, fallback to `localStorage`.

### 2. Balances (fake data on web)
- `useBondumBalance` → return `{ balance: 12500 }` on web
- `useTokenBalances` → return fake array on web:
  - SOL: 2.5
  - BONDUM: 12,500
  - USDC: 45.00
  - PANICAFE: 3,200
  - SKR: 1
- No RPC calls on web.

### 3. NFTs (fake data on web)
- `useWalletNfts` → return 3 fake NFTs on web:
  - "Bondum OG #42" (placeholder image)
  - "PaniCafe VIP #7" (placeholder image)
  - "Solana Seeker #128" (placeholder image)

### 4. Streak (fake data on web)
- `useStreak` → return fake streak on web:
  - currentStreak: 7, totalScans: 23, multiplier: 1.7
  - nextMilestone: { days: 14, bonus: 500, label: "2 Weeks" }
  - `logScan()` → no-op

### 5. Rewards (use offline catalog)
- `useRewards` already has offline fallback — should work on web as-is if API is reachable. If not, the offline catalog kicks in.

### 6. QR Scan (mock camera + scan result)
- In `src/app/scan/index.tsx`, on web:
  - Skip camera permission request
  - Show scanner UI with overlay (no camera feed — just purple background)
  - Auto-trigger a fake scan after 2 seconds with a PaniCafe box result
  - Show reward preview card normally

### 7. Claim Flow (mock API response)
- `claimPanicafeBox` on web → return fake success:
  ```json
  { "success": true, "txSignature": "5xDemo...abc", "tokenAmount": 150, "mint": "PANICAFE", "message": "+150 PANICAFE", "multiplier": 1.7, "currentStreak": 7 }
  ```
- `claimScanReward` on web → similar fake success
- Reward detail claim (`requestPanicafeRewardClaim`) on web → return fake serialized tx + auto-complete

### 8. Smart Recommendation (mock on web)
- `fetchSmartRecommendation` on web → return static recommendation

### 9. Swap Quote (mock on web)
- `useSwapQuote` on web → return fake quote based on input amount
- No Jupiter API calls

### 10. Auth Context (demo user on web)
- Guest mode on web: username = "Bondum User", address = "DemoAddr1234...abcd"

---

## Webreel Demo Script (all actions)

**Viewport:** iPhone 15 (393×852) | **FPS:** 30 | **Quality:** 90

### Flow:
1. **Welcome** (3s) — show auth screen with all options
2. **Guest Login** — click "Continue as Guest", wait for home
3. **Home Dashboard** (5s) — show balances, streak banner, scroll to daily challenge + featured rewards
4. **Scan QR** — tap Scan → scanner UI → auto-scan → reward preview → claim → success animation with streak bonus
5. **Rewards Marketplace** — tap Rewards → brands view → PaniCafe → browse rewards → select a coupon → claim it → success
6. **Trade/Swap** — tap Trade → select SOL→USDC → enter amount → show quote with price impact
7. **Assets/Wallet** — tap Assets → NFT grid → token list → scroll
8. **Send** — tap Send (from home) → paste address → select BONDUM → enter amount → (don't submit)
9. **Profile** — tap Profile → copy wallet address → tap referral → share screen
10. **Settings** — navigate to settings → show language toggle → show account info

**Total estimated duration:** ~90-120 seconds

---

## Files Modified

| File | Change |
|------|--------|
| `src/services/storage/secureStorage.ts` | localStorage fallback on web |
| `src/hooks/useBondumBalance.ts` | Mock return on web |
| `src/hooks/useTokenBalances.ts` | Mock return on web |
| `src/hooks/useWalletNfts.ts` | Mock return on web |
| `src/hooks/useStreak.ts` | Mock return on web |
| `src/hooks/useSwapQuote.ts` | Mock return on web |
| `src/services/rewardApi.ts` | Mock claim + recommendation on web |
| `src/app/scan/index.tsx` | Mock camera + auto-scan on web |
| `src/app/(tabs)/(rewards)/[id].tsx` | Mock claim flow on web |
| `src/contexts/AuthContext.tsx` | Demo user name + address on web |
| `webreel.config.json` | Full demo script |

All mocks gated behind `Platform.OS === 'web'` — zero production impact.
