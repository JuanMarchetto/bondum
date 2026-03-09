# Demo Recording v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Record a polished ~2 min MP4 demo of Bondum via webreel + Expo Web, with mocked balances, NFTs, QR scan, and coupon claim — all gated behind `Platform.OS === 'web'`.

**Architecture:** Add web-only mock returns at the top of each hook/service function. On web, hooks return static data immediately without RPC/API calls. The scan screen auto-triggers a fake QR result. The claim functions return fake success responses. Zero production impact.

**Tech Stack:** webreel, Expo Web, React Query, Platform.OS guards

---

### Task 1: Polyfill secure storage for web

**Files:**
- Modify: `src/services/storage/secureStorage.ts`

**Step 1: Add Platform import and localStorage fallback**

Replace the entire file content with:

```typescript
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_PROVIDER_KEY = 'auth_provider'
const USER_DATA_KEY = 'user_data'
const LANGUAGE_KEY = 'app_language'

// Web fallback: use localStorage since expo-secure-store is mobile-only
const getItem = (key: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.getItem(key))
    : SecureStore.getItemAsync(key)

const setItem = (key: string, value: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.setItem(key, value))
    : SecureStore.setItemAsync(key, value)

const deleteItem = (key: string) =>
  Platform.OS === 'web'
    ? Promise.resolve(localStorage.removeItem(key))
    : SecureStore.deleteItemAsync(key)

export const secureStorage = {
  // Auth token
  getAuthToken: () => getItem(AUTH_TOKEN_KEY),
  setAuthToken: (token: string) => setItem(AUTH_TOKEN_KEY, token),
  removeAuthToken: () => deleteItem(AUTH_TOKEN_KEY),

  // Auth provider
  getAuthProvider: () => getItem(AUTH_PROVIDER_KEY),
  setAuthProvider: (provider: string) => setItem(AUTH_PROVIDER_KEY, provider),
  removeAuthProvider: () => deleteItem(AUTH_PROVIDER_KEY),

  // User data
  getUserData: async () => {
    const data = await getItem(USER_DATA_KEY)
    return data ? JSON.parse(data) : null
  },
  setUserData: (data: object) => setItem(USER_DATA_KEY, JSON.stringify(data)),
  removeUserData: () => deleteItem(USER_DATA_KEY),

  // Language
  getLanguage: () => getItem(LANGUAGE_KEY),
  setLanguage: (lang: 'en' | 'es') => setItem(LANGUAGE_KEY, lang),

  // Clear all auth data
  clearAuth: async () => {
    await Promise.all([
      deleteItem(AUTH_TOKEN_KEY),
      deleteItem(AUTH_PROVIDER_KEY),
      deleteItem(USER_DATA_KEY),
    ])
  },
}
```

**Step 2: Verify Expo Web starts without crash**

Run: `npm run web`
Open in browser → should load welcome screen without SecureStore crash.

**Step 3: Commit**

```bash
git add src/services/storage/secureStorage.ts
git commit -m "fix: polyfill secure storage with localStorage on web"
```

---

### Task 2: Mock auth context for web demo user

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Add web demo user to connectAsGuest**

Add `Platform` import at top:

```typescript
import { Platform } from 'react-native'
```

Replace the `connectAsGuest` callback (lines 165-181) with:

```typescript
  const connectAsGuest = useCallback(() => {
    const isWeb = Platform.OS === 'web'
    const user: User = {
      id: 'guest',
      username: isWeb ? 'Bondum User' : 'Guest',
      avatarUrl: null,
    }

    setAuthState({
      isAuthenticated: true,
      provider: 'guest',
      address: isWeb ? 'Demo7xR4nkJv9fS2mBqazALp8xKYcPe3z' : null,
      user,
    })

    secureStorage.setAuthProvider('guest')
    secureStorage.setUserData({ address: isWeb ? 'Demo7xR4nkJv9fS2mBqazALp8xKYcPe3z' : null, user })
  }, [])
```

**Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: inject demo wallet address for web guest mode"
```

---

### Task 3: Mock balance hooks for web

**Files:**
- Modify: `src/hooks/useBondumBalance.ts`
- Modify: `src/hooks/useTokenBalances.ts`

**Step 1: Mock useBondumBalance**

Add at the top of `useBondumBalance.ts`, after imports:

```typescript
import { Platform } from 'react-native'
```

Add web mock at the start of the function body (before `useAuth`):

```typescript
export function useBondumBalance() {
  // Web demo: return fake balance
  if (Platform.OS === 'web') {
    return { balance: 12500, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  const { address, isAuthenticated } = useAuth()
  // ... rest unchanged
```

**Step 2: Mock useTokenBalances**

Add at the top of `useTokenBalances.ts`, after imports:

```typescript
import { Platform } from 'react-native'
```

Add web mock at the start of the function body:

```typescript
export function useTokenBalances() {
  // Web demo: return fake token balances
  if (Platform.OS === 'web') {
    return {
      tokens: [
        { symbol: 'SOL', name: 'Solana', balance: 2.5, icon: '◎' },
        { symbol: 'BONDUM', name: 'Bondum', balance: 12500, icon: '🅱️' },
        { symbol: 'USDC', name: 'USD Coin', balance: 45.0, icon: '💲' },
        { symbol: 'PANICAFE', name: 'PaniCafe', balance: 3200, icon: '☕' },
        { symbol: 'SKR', name: 'Seeker', balance: 1, icon: '📱' },
      ] as TokenInfo[],
      isLoading: false,
      error: null,
      refetch: async () => ({} as any),
    }
  }

  const { address, isAuthenticated } = useAuth()
  // ... rest unchanged
```

**Step 3: Commit**

```bash
git add src/hooks/useBondumBalance.ts src/hooks/useTokenBalances.ts
git commit -m "feat: mock token balances on web for demo"
```

---

### Task 4: Mock NFTs for web

**Files:**
- Modify: `src/hooks/useWalletNfts.ts`

**Step 1: Add web mock with 3 fake NFTs**

Add after imports:

```typescript
import { Platform } from 'react-native'
```

Add web mock at the start of the function body:

```typescript
export function useWalletNfts() {
  // Web demo: return fake NFTs
  if (Platform.OS === 'web') {
    const fakeNfts = [
      { id: 'nft-1', name: 'Bondum OG #42', imageUrl: 'https://placehold.co/200x200/8B5CF6/white?text=OG+%2342' },
      { id: 'nft-2', name: 'PaniCafe VIP #7', imageUrl: 'https://placehold.co/200x200/d97706/white?text=VIP+%237' },
      { id: 'nft-3', name: 'Solana Seeker #128', imageUrl: 'https://placehold.co/200x200/14b8a6/white?text=Seeker+%23128' },
    ]
    return { nfts: fakeNfts, nftCount: 3, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  const { address, isAuthenticated } = useAuth()
  // ... rest unchanged
```

**Step 2: Commit**

```bash
git add src/hooks/useWalletNfts.ts
git commit -m "feat: mock NFTs on web for demo"
```

---

### Task 5: Mock streak for web

**Files:**
- Modify: `src/hooks/useStreak.ts`

**Step 1: Add web mock**

Add after imports:

```typescript
import { Platform } from 'react-native'
```

Add web mock at the start of the function body:

```typescript
export function useStreak() {
  // Web demo: return fake streak data
  if (Platform.OS === 'web') {
    return {
      currentStreak: 7,
      longestStreak: 12,
      totalScans: 23,
      lastScanDate: '2026-03-08',
      multiplier: 1.7,
      nextMilestone: { days: 14, bonus: 500, label: '2 Weeks' },
      logScan: async () => ({ currentStreak: 8, longestStreak: 12, totalScans: 24, lastScanDate: '2026-03-09' }),
    }
  }

  const { isAuthenticated, address } = useAuth()
  // ... rest unchanged
```

**Step 2: Commit**

```bash
git add src/hooks/useStreak.ts
git commit -m "feat: mock streak on web for demo"
```

---

### Task 6: Mock swap quote for web

**Files:**
- Modify: `src/hooks/useSwapQuote.ts`

**Step 1: Add web mock**

Add after imports:

```typescript
import { Platform } from 'react-native'
```

Add web mock at the start of the function body (before state declarations):

```typescript
export function useSwapQuote(
  fromToken: TokenSymbol | null,
  toToken: TokenSymbol | null,
  fromAmount: string,
): UseSwapQuoteResult {
  // Web demo: return fake quote
  if (Platform.OS === 'web') {
    const amount = parseFloat(fromAmount) || 0
    if (!fromToken || !toToken || fromToken === toToken || amount <= 0) {
      return { quote: null, toAmount: '0', priceImpact: 0, isLoading: false, error: null }
    }
    // Fake conversion rates
    const rates: Record<string, number> = { 'SOL-USDC': 180, 'SOL-BONDUM': 50000, 'USDC-SOL': 0.0055, 'USDC-BONDUM': 277, 'BONDUM-SOL': 0.00002, 'BONDUM-USDC': 0.0036 }
    const rate = rates[`${fromToken}-${toToken}`] || 1
    const out = (amount * rate).toFixed(toToken === 'SOL' ? 4 : 2)
    return {
      quote: { outAmount: '0', priceImpact: 0.12, rawQuoteResponse: {} },
      toAmount: out,
      priceImpact: 0.12,
      isLoading: false,
      error: null,
    }
  }

  const [quote, setQuote] = useState<SwapQuote | null>(null)
  // ... rest unchanged
```

**Step 2: Commit**

```bash
git add src/hooks/useSwapQuote.ts
git commit -m "feat: mock swap quote on web for demo"
```

---

### Task 7: Mock claim APIs for web

**Files:**
- Modify: `src/services/rewardApi.ts`

**Step 1: Add Platform import**

Add at the top of `rewardApi.ts`:

```typescript
import { Platform } from 'react-native'
```

**Step 2: Mock claimScanReward**

Add web mock at the start of the `claimScanReward` function body:

```typescript
export async function claimScanReward(params: { ... }): Promise<ClaimResult> {
  // Web demo: return fake claim result
  if (Platform.OS === 'web') {
    await new Promise(r => setTimeout(r, 1500)) // Simulate network delay
    return {
      success: true,
      txSignature: '5xDemoTx' + Math.random().toString(36).slice(2, 10) + 'abcdef1234567890',
      tokenAmount: params.tokenAmount,
      mint: 'BONDUM',
      message: `+${params.tokenAmount} BONDUM tokens sent`,
      multiplier: 1.7,
      streakBonus: 15,
      currentStreak: 7,
      milestoneReached: null,
      milestoneBonus: 0,
    } as any
  }

  const response = await fetch(...)
  // ... rest unchanged
```

**Step 3: Mock claimPanicafeBox**

Add web mock at the start of `claimPanicafeBox`:

```typescript
export async function claimPanicafeBox(params: { ... }): Promise<ClaimResult> {
  // Web demo: return fake PaniCafe claim result
  if (Platform.OS === 'web') {
    await new Promise(r => setTimeout(r, 1500))
    return {
      success: true,
      txSignature: '4pDemo' + Math.random().toString(36).slice(2, 10) + 'panicafe9876543210',
      tokenAmount: 150,
      mint: 'H27GCsgxeM8RKMta6uBxhQeKSqUv9u4M5c2FyStoFbd1',
      message: '150 PANICAFE tokens sent to your wallet',
      multiplier: 1.7,
      currentStreak: 7,
    } as any
  }

  const response = await fetch(...)
  // ... rest unchanged
```

**Step 4: Mock fetchSmartRecommendation**

Add web mock at the start of `fetchSmartRecommendation`:

```typescript
export async function fetchSmartRecommendation(params: { ... }): Promise<SmartRecommendation> {
  // Web demo: return compelling recommendation
  if (Platform.OS === 'web') {
    return {
      recommendation: 'Your 7-day streak gives you 1.7x multiplier! Scan now to maximize rewards before your streak resets.',
      reasoning: 'Active streak with high multiplier',
      suggestedReward: 'pc-1',
      urgency: 'high',
    }
  }

  try {
    // ... rest unchanged
```

**Step 5: Mock fetchStreak**

Add web mock at the start of `fetchStreak`:

```typescript
export async function fetchStreak(walletAddress: string): Promise<StreakInfo> {
  // Web demo: return fake streak
  if (Platform.OS === 'web') {
    return { currentStreak: 7, longestStreak: 12, totalScans: 23, multiplier: 1.7, nextMilestone: { days: 14, bonus: 500, label: '2 Weeks' } }
  }

  try {
    // ... rest unchanged
```

**Step 6: Mock requestPanicafeRewardClaim and requestRedemption for reward detail page**

Add web mock at the start of `requestPanicafeRewardClaim`:

```typescript
export async function requestPanicafeRewardClaim(params: { ... }): Promise<{ id: number; serializedTransaction: string }> {
  // Web demo: not reachable (claim is mocked at screen level)
  if (Platform.OS === 'web') {
    return { id: 1, serializedTransaction: '' }
  }
  // ... rest unchanged
```

Add web mock at the start of `requestRedemption`:

```typescript
export async function requestRedemption(params: { ... }): Promise<RedeemRequestResult> {
  // Web demo: not reachable (claim is mocked at screen level)
  if (Platform.OS === 'web') {
    return { serializedTransaction: '', rewardId: params.rewardId, cost: 0, lastValidBlockHeight: 0 }
  }
  // ... rest unchanged
```

**Step 7: Commit**

```bash
git add src/services/rewardApi.ts
git commit -m "feat: mock claim APIs on web for demo"
```

---

### Task 8: Mock QR scan screen for web

**Files:**
- Modify: `src/app/scan/index.tsx`

**Step 1: Add Platform import and web auto-scan**

Add to imports:

```typescript
import { Platform } from 'react-native'
```

Replace the camera permission check and scanner view section. After the `ScanHeader` component definition (after line 177), add a web-specific early return before the `if (!permission)` check:

```typescript
  // ─── Web demo: skip camera, auto-trigger fake scan ─────────────────────
  if (Platform.OS === 'web' && !parsedReward && !rewardClaimed) {
    // Auto-trigger a fake PaniCafe scan after 2 seconds
    useEffect(() => {
      if (scanned) return
      const timer = setTimeout(() => {
        setScanned(true)
        setParsedReward({
          brand: 'PaniCafe',
          type: 'token',
          value: 'PANICAFE REWARD',
          title: 'PaniCafe Box Reward',
          tokenAmount: 150,
          nonce: 'demo-box-token',
        })
      }, 2000)
      return () => clearTimeout(timer)
    }, [scanned])

    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />
        <View className="flex-1 px-5 pt-4">
          <Text className="text-center mb-4">
            <Text className="text-violet-500 font-bold italic" style={{ fontSize: 28 }}>{t('scan.title')} </Text>
            <Text className="text-gray-900 font-extrabold" style={{ fontSize: 28 }}>{t('scan.titleSuffix')}</Text>
          </Text>
          <View className="rounded-2xl overflow-hidden relative" style={{ width: '100%', aspectRatio: 1, backgroundColor: '#1e1b4b' }}>
            {/* Scanner overlay without camera */}
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-64 h-64">
                <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-violet-500 rounded-tl-lg" />
                <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-violet-500 rounded-tr-lg" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-violet-500 rounded-bl-lg" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-violet-500 rounded-br-lg" />
              </View>
            </View>
            <ScanLine />
          </View>
          <Text className="text-gray-400 text-center mt-6" style={{ fontSize: 15, lineHeight: 22 }}>
            {t('scan.scanDescription')}
          </Text>
        </View>
      </View>
    )
  }
```

**Important:** The `useEffect` call inside the conditional will need to be moved. Since React hooks can't be called conditionally, restructure by adding the effect at the top level of the component (after the existing state declarations around line 68):

```typescript
  // Web demo: auto-trigger fake scan after 2 seconds
  useEffect(() => {
    if (Platform.OS !== 'web' || scanned || parsedReward || rewardClaimed) return
    const timer = setTimeout(() => {
      setScanned(true)
      setParsedReward({
        brand: 'PaniCafe',
        type: 'token',
        value: 'PANICAFE REWARD',
        title: 'PaniCafe Box Reward',
        tokenAmount: 150,
        nonce: 'demo-box-token',
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [scanned, parsedReward, rewardClaimed])
```

Then the web scanner view (without `useEffect`) replaces the permission/camera section only on web. Add before the `if (!permission)` check:

```typescript
  if (Platform.OS === 'web' && !parsedReward && !rewardClaimed) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />
        <View className="flex-1 px-5 pt-4">
          <Text className="text-center mb-4">
            <Text className="text-violet-500 font-bold italic" style={{ fontSize: 28 }}>{t('scan.title')} </Text>
            <Text className="text-gray-900 font-extrabold" style={{ fontSize: 28 }}>{t('scan.titleSuffix')}</Text>
          </Text>
          <View className="rounded-2xl overflow-hidden relative" style={{ width: '100%', aspectRatio: 1, backgroundColor: '#1e1b4b' }}>
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-64 h-64">
                <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-violet-500 rounded-tl-lg" />
                <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-violet-500 rounded-tr-lg" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-violet-500 rounded-bl-lg" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-violet-500 rounded-br-lg" />
              </View>
            </View>
            <ScanLine />
          </View>
          <Text className="text-gray-400 text-center mt-6" style={{ fontSize: 15, lineHeight: 22 }}>
            {t('scan.scanDescription')}
          </Text>
        </View>
      </View>
    )
  }
```

**Step 2: Commit**

```bash
git add src/app/scan/index.tsx
git commit -m "feat: mock QR scanner with auto-scan on web for demo"
```

---

### Task 9: Mock reward detail claim for web

**Files:**
- Modify: `src/app/(tabs)/(rewards)/[id].tsx`

**Step 1: Add Platform import and mock handleClaim for web**

Add to imports:

```typescript
import { Platform } from 'react-native'
```

Replace the `handleClaim` function (lines 133-166) with a version that mocks on web:

```typescript
  const handleClaim = async () => {
    if (!user || !address) {
      Alert.alert(t('common.error'), t('rewardDetail.connectWallet'))
      return
    }
    if (activeBalance < reward.cost) {
      Alert.alert(t('rewardDetail.insufficientBalance'), t('rewardDetail.needMore', { amount: reward.cost - activeBalance, symbol: tokenSymbol }))
      return
    }
    setIsClaiming(true)
    try {
      let sig: string

      if (Platform.OS === 'web') {
        // Web demo: fake claim with delay
        await new Promise(r => setTimeout(r, 1500))
        sig = '3xDemoReward' + Math.random().toString(36).slice(2, 10) + 'abcdef1234567890'
      } else {
        sig = isPanicafe ? await handleClaimPanicafe() : await handleClaimBondum()
      }

      setTxSignature(sig)

      await addClaimedReward({
        id: `reward-${reward.id}-${Date.now()}`,
        brand: reward.brand,
        type: reward.type,
        value: reward.value,
        claimedAt: new Date().toISOString(),
        txSignature: sig || undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setClaimed(true)

      queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('rewardDetail.claimFailed'))
    } finally {
      setIsClaiming(false)
    }
  }
```

**Step 2: Commit**

```bash
git add src/app/(tabs)/(rewards)/[id].tsx
git commit -m "feat: mock reward claim on web for demo"
```

---

### Task 10: Create webreel config

**Files:**
- Create: `webreel.config.json`

**Step 1: Write the full demo script**

Create `webreel.config.json` at project root:

```json
{
  "$schema": "https://webreel.dev/schema/v1.json",
  "outDir": "videos/",
  "baseUrl": "http://localhost:8081",
  "viewport": { "width": 393, "height": 852 },
  "defaultDelay": 800,
  "clickDwell": 300,
  "theme": {
    "cursor": {
      "size": 28,
      "hotspot": "center"
    }
  },
  "videos": {
    "bondum-demo": {
      "url": "/",
      "waitFor": "Continue as Guest",
      "output": "bondum-demo.mp4",
      "fps": 30,
      "quality": 90,
      "steps": [
        { "action": "pause", "ms": 2000, "description": "Show welcome screen with auth options" },

        { "action": "click", "text": "Continue as Guest", "delay": 2500, "description": "Login as guest → demo user" },

        { "action": "wait", "text": "Home", "timeout": 8000, "description": "Wait for home screen to load" },
        { "action": "pause", "ms": 2000, "description": "Show home dashboard with balances" },
        { "action": "scroll", "y": 300, "delay": 1500, "description": "Scroll to streak banner + daily challenge" },
        { "action": "scroll", "y": 300, "delay": 1500, "description": "Scroll to featured rewards carousel" },
        { "action": "scroll", "y": -600, "delay": 1000, "description": "Scroll back to top" },

        { "action": "click", "text": "Scan", "delay": 1000, "description": "Tap Scan quick action" },
        { "action": "pause", "ms": 3000, "description": "Show scanner UI → auto-scan triggers" },
        { "action": "pause", "ms": 1500, "description": "Show reward preview card" },
        { "action": "click", "text": "Claim", "delay": 2500, "description": "Claim the PaniCafe reward" },
        { "action": "pause", "ms": 2500, "description": "Show claim success with tx confirmation" },
        { "action": "click", "text": "View Rewards", "delay": 1500, "description": "Navigate to rewards" },

        { "action": "pause", "ms": 1500, "description": "Show rewards brands view" },
        { "action": "click", "text": "PaniCafe Rewards", "delay": 1500, "description": "Open PaniCafe rewards" },
        { "action": "pause", "ms": 1000, "description": "Show PaniCafe reward list" },
        { "action": "scroll", "y": 250, "delay": 1000, "description": "Browse PaniCafe rewards" },
        { "action": "scroll", "y": -250, "delay": 800, "description": "Back to top" },
        { "action": "click", "text": "Free Coffee", "delay": 1500, "description": "Select Free Coffee coupon" },
        { "action": "pause", "ms": 1500, "description": "Show coupon detail with cost + claim button" },
        { "action": "click", "text": "Claim", "delay": 2500, "description": "Claim the coupon" },
        { "action": "pause", "ms": 2500, "description": "Show coupon claimed success animation" },
        { "action": "click", "text": "Back to Rewards", "delay": 1500, "description": "Return to rewards list" },

        { "action": "click", "text": "Trade", "delay": 1500, "description": "Navigate to Trade tab" },
        { "action": "pause", "ms": 1500, "description": "Show swap interface" },
        { "action": "click", "selector": "input", "delay": 500, "description": "Focus amount input" },
        { "action": "type", "text": "1.5", "selector": "input", "charDelay": 150, "delay": 2000, "description": "Type swap amount" },
        { "action": "pause", "ms": 2000, "description": "Show quote result with price impact" },

        { "action": "click", "text": "Wallet", "delay": 1500, "description": "Navigate to Assets tab" },
        { "action": "pause", "ms": 1500, "description": "Show NFT collection + token list" },
        { "action": "scroll", "y": 200, "delay": 1500, "description": "Scroll through tokens" },
        { "action": "scroll", "y": -200, "delay": 1000, "description": "Back to top" },

        { "action": "click", "text": "Profile", "delay": 1500, "description": "Navigate to Profile tab" },
        { "action": "pause", "ms": 1500, "description": "Show profile with balance + wallet" },
        { "action": "scroll", "y": 200, "delay": 1500, "description": "Scroll to wallet security" },
        { "action": "scroll", "y": -200, "delay": 1000, "description": "Back to top" },

        { "action": "click", "text": "Home", "delay": 1500, "description": "Return to Home" },
        { "action": "pause", "ms": 2000, "description": "Final home screen" }
      ]
    }
  }
}
```

**Step 2: Validate config**

Run: `npx webreel validate`
Expected: No errors

**Step 3: Commit**

```bash
git add webreel.config.json
git commit -m "feat: add webreel demo config with full app walkthrough"
```

---

### Task 11: Preview and iterate

**Step 1: Start Expo Web**

Run (background): `npm run web`
Wait for server to start on localhost:8081

**Step 2: Preview the demo**

Run: `npx webreel preview bondum-demo --verbose`

Watch for:
- Elements not found (wrong text/selector) → fix in config
- Timing issues (too fast/slow) → adjust delays
- Screens not rendering → fix mocks

**Step 3: Fix issues found during preview**

Common fixes:
- Tab text might be different — check actual rendered text
- "Claim" button text might need `within` scoping to avoid ambiguity
- Scroll amounts may need adjusting based on actual content height
- Some elements may need `selector` instead of `text`

**Step 4: Commit fixes**

```bash
git add webreel.config.json
git commit -m "chore: tune demo timing and selectors after preview"
```

---

### Task 12: Record the final video

**Step 1: Ensure Expo Web is running**

Verify `http://localhost:8081` responds.

**Step 2: Record**

Run: `npx webreel record bondum-demo --verbose`
Expected: Recording completes, output at `videos/bondum-demo.mp4`

**Step 3: Verify output**

Check file exists and duration is ~90-120 seconds:
```bash
ls -la videos/bondum-demo.mp4
ffprobe -v quiet -show_entries format=duration -of csv=p=0 videos/bondum-demo.mp4
```

**Step 4: Commit**

```bash
git add webreel.config.json
git commit -m "feat: record Bondum demo v2 for MONOLITH hackathon"
```
