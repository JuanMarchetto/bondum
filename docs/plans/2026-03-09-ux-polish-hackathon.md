# UX/UI Polish — Hackathon Final Push

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix mixed-language strings, visual inconsistencies, and misleading Bondum rewards to present a polished, consistent demo for the MONOLITH hackathon submission.

**Architecture:** All changes are client-side (React Native + NativeWind). i18n fallbacks get language-aware translations. Home screen switches from unavailable Bondum rewards to live PaniCafe rewards. Visual polish applied to reward cards, NFT empty state, and username truncation.

**Tech Stack:** React Native, Expo Router, NativeWind (Tailwind), React Query, i18n context

---

### Task 1: Fix i18n Fallback Strings in rewardApi.ts

The `fetchDailyChallenge()` and `fetchSmartRecommendation()` fallback strings are hardcoded in English. Since the API is unreachable during demo, these fallbacks always show. We can't use the React language context in a non-component file, so we'll add both languages and accept a `language` parameter.

**Files:**
- Modify: `src/services/rewardApi.ts:327-361`
- Modify: `src/app/(tabs)/(home)/index.tsx:39-55` (pass language to fetchers)

**Step 1: Add language parameter to fetchDailyChallenge**

In `src/services/rewardApi.ts`, change the `fetchDailyChallenge` function:

```typescript
export async function fetchDailyChallenge(language: string = 'en'): Promise<DailyChallenge> {
  try {
    const response = await fetch(`${REWARD_API_URL}/daily-challenge`)
    if (!response.ok) throw new Error()
    return response.json()
  } catch {
    return {
      type: 'scan',
      description: language === 'es' ? 'Escaneá un código QR hoy' : 'Scan a QR code today',
      reward: 100,
      target: 1,
      dayOfYear: 0,
    }
  }
}
```

**Step 2: Add language parameter to fetchSmartRecommendation**

In `src/services/rewardApi.ts`, change the `fetchSmartRecommendation` function to accept language in params and use it in the fallback:

```typescript
export async function fetchSmartRecommendation(params: {
  walletAddress: string
  streak: number
  balance: number
  language?: string
}): Promise<SmartRecommendation> {
  try {
    const response = await fetch(`${REWARD_API_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!response.ok) throw new Error()
    return response.json()
  } catch {
    const isEs = params.language === 'es'
    return {
      recommendation: isEs
        ? '¡Escaneá un código QR para empezar a ganar recompensas con multiplicadores de racha!'
        : 'Scan a QR code to start earning rewards with streak multipliers!',
      reasoning: 'Default recommendation',
      suggestedReward: null,
      urgency: 'low',
    }
  }
}
```

**Step 3: Pass language from home screen to fetchers**

In `src/app/(tabs)/(home)/index.tsx`, update the query calls:

```typescript
const { t, language } = useLanguage()

// Daily challenge — pass language
const { data: dailyChallenge } = useQuery({
  queryKey: ['dailyChallenge', language],
  queryFn: () => fetchDailyChallenge(language),
  staleTime: 5 * 60_000,
})

// Smart recommendation — pass language
const { data: smartRecommendation } = useQuery({
  queryKey: ['smartRecommendation', address, currentStreak, bondumBalance, language],
  queryFn: () => fetchSmartRecommendation({
    walletAddress: address!,
    streak: currentStreak,
    balance: bondumBalance,
    language,
  }),
  enabled: !!address,
  staleTime: 2 * 60_000,
})
```

**Step 4: Commit**

```bash
git add src/services/rewardApi.ts src/app/(tabs)/(home)/index.tsx
git commit -m "fix(i18n): add language-aware fallbacks for daily challenge and smart recommendation"
```

---

### Task 2: Translate Offline Reward Catalog

The `getOfflineCatalog()` in `rewardApi.ts` has all English titles/descriptions. Since this is a non-component function, we add a `language` parameter and provide Spanish variants.

**Files:**
- Modify: `src/services/rewardApi.ts:71-82,365-427`
- Modify: `src/hooks/useRewards.ts:1-22`
- Modify: `src/app/(tabs)/(home)/index.tsx:33` (pass language to useRewards)

**Step 1: Add language param to fetchRewards and getOfflineCatalog**

In `src/services/rewardApi.ts`, update `fetchRewards`:

```typescript
export async function fetchRewards(brand?: string, language: string = 'en'): Promise<RewardCatalogItem[]> {
  try {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : ''
    const response = await fetch(`${REWARD_API_URL}/rewards${params}`)
    if (!response.ok) throw new Error('Failed to fetch rewards')
    const data = await response.json()
    return data.rewards
  } catch {
    return getOfflineCatalog(brand, language)
  }
}
```

**Step 2: Add Spanish translations to getOfflineCatalog**

Replace the `getOfflineCatalog` function with language-aware versions:

```typescript
function getOfflineCatalog(brand?: string, language: string = 'en'): RewardCatalogItem[] {
  const isEs = language === 'es'

  const bondumRewards: RewardCatalogItem[] = [
    {
      id: '1', brand: 'Bondum', type: 'discount',
      title: isEs ? '40% de descuento en tu próxima compra' : '40% discount on your next purchase',
      description: isEs ? '40% de descuento en tu próxima compra de cualquier producto' : '40% discount on your next purchase of any product',
      value: '40% OFF', cost: 5000, available: 3,
    },
    {
      id: '2', brand: 'Bondum', type: 'discount',
      title: isEs ? '15% de descuento en tu próxima compra' : '15% discount on your next purchase of the product',
      description: isEs ? '15% de descuento en tu próxima compra del producto' : '15% discount on your next purchase of the product',
      value: '15% OFF', cost: 10000, available: 3,
    },
    {
      id: '3', brand: 'Bondum', type: 'token',
      title: isEs ? 'Bonus de tokens $BONDUM' : 'Bonus $BONDUM tokens',
      description: isEs ? 'Recibí 500 tokens $BONDUM de bonus' : 'Receive 500 bonus $BONDUM tokens',
      value: '500 $BONDUM', cost: 2000, available: 10, tokenAmount: 500,
    },
    {
      id: '4', brand: 'Bondum', type: 'nft',
      title: isEs ? 'NFT Exclusivo de Bondum' : 'Exclusive Bondum NFT',
      description: isEs ? 'Un NFT ultra raro exclusivo de Bondum para tu colección' : 'An exclusive ultra rare Bondum NFT for your collection',
      value: isEs ? 'NFT ULTRA RARO' : 'ULTRA RARE NFT', cost: 15000, available: 1,
    },
  ]

  const panicafeRewards: RewardCatalogItem[] = [
    { id: 'pc-1', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Café gratis con cualquier compra de panadería' : 'Free Coffee with any pastry purchase', description: isEs ? 'Obtenés un café gratis al comprar cualquier producto de panadería en PaniCafe' : 'Get a free coffee when you buy any pastry at PaniCafe', value: isEs ? 'CAFÉ GRATIS' : 'FREE COFFEE', cost: 1000, available: 5 },
    { id: 'pc-2', brand: 'PaniCafe', type: 'discount', title: isEs ? '25% de descuento en cualquier bebida' : '25% off any drink', description: isEs ? '25% de descuento en cualquier bebida en PaniCafe' : '25% discount on any drink at PaniCafe', value: '25% OFF', cost: 2000, available: 3 },
    { id: 'pc-3', brand: 'PaniCafe', type: 'token', title: isEs ? 'Bonus de tokens PaniCafe' : 'Bonus PaniCafe tokens', description: isEs ? 'Recibí 200 tokens PANICAFE de bonus' : 'Receive 200 bonus PANICAFE tokens', value: '200 PANICAFE', cost: 500, available: 10, tokenAmount: 200 },
    { id: 'pc-4', brand: 'PaniCafe', type: 'discount', title: isEs ? '50% de descuento en la factura del día' : '50% off pastry of the day', description: isEs ? '50% de descuento en la factura del día' : '50% discount on the pastry of the day', value: '50% OFF', cost: 3000, available: 2 },
    { id: 'pc-5', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Café Gratis' : 'Free Café', description: isEs ? 'Canjeá por un Café gratis en cualquier sucursal de PaniCafe' : 'Redeem for a free Café at any PaniCafe location', value: isEs ? 'CAFÉ GRATIS' : 'FREE CAFÉ', cost: 30000, available: 5 },
    { id: 'pc-6', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Medialuna o Factura Gratis' : 'Free Medialuna or Factura', description: isEs ? 'Canjeá por una Medialuna o Factura gratis' : 'Redeem for a free Medialuna or Factura pastry', value: 'MEDIALUNA', cost: 20000, available: 8 },
    { id: 'pc-7', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Croissant Gratis' : 'Free Croissant', description: isEs ? 'Canjeá por un Croissant gratis en PaniCafe' : 'Redeem for a free Croissant at PaniCafe', value: 'CROISSANT', cost: 40000, available: 4 },
    { id: 'pc-8', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Jugo Natural Gratis' : 'Free Jugo Natural', description: isEs ? 'Canjeá por un jugo natural fresco en PaniCafe' : 'Redeem for a fresh natural juice at PaniCafe', value: 'JUGO NATURAL', cost: 40000, available: 4 },
    { id: 'pc-9', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Desayuno Tradicional' : 'Desayuno Tradicional', description: isEs ? 'Canjeá por un desayuno tradicional completo en PaniCafe' : 'Redeem for a full traditional breakfast at PaniCafe', value: 'DESAYUNO', cost: 70000, available: 2 },
    { id: 'pc-10', brand: 'PaniCafe', type: 'discount', title: isEs ? 'Helado Dos Bochas' : 'Helado Dos Bochas', description: isEs ? 'Canjeá por un helado de dos bochas en PaniCafe' : 'Redeem for a two-scoop ice cream at PaniCafe', value: 'HELADO', cost: 50000, available: 3 },
    { id: 'pc-11', brand: 'PaniCafe', type: 'discount', title: isEs ? '1/4 Kilo de Helado' : '1/4 Kilo de Helado', description: isEs ? 'Canjeá por un cuarto kilo de helado' : 'Redeem for a quarter kilo of ice cream', value: '1/4 KG HELADO', cost: 80000, available: 2 },
  ]

  const all = [...bondumRewards, ...panicafeRewards]
  if (!brand) return all
  return all.filter((r) => r.brand.toLowerCase() === brand.toLowerCase())
}
```

**Step 3: Update useRewards hook to pass language**

In `src/hooks/useRewards.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchRewards, type RewardCatalogItem } from '../services/rewardApi'
import { useLanguage } from '../contexts/LanguageContext'

export function useRewards(brand?: string) {
  const { language } = useLanguage()
  const {
    data: rewards = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rewards', brand, language],
    queryFn: () => fetchRewards(brand, language),
    staleTime: 60_000,
    refetchOnMount: 'always',
  })

  return { rewards, isLoading, error, refetch }
}
```

**Step 4: Commit**

```bash
git add src/services/rewardApi.ts src/hooks/useRewards.ts
git commit -m "fix(i18n): translate offline reward catalog for Spanish/English"
```

---

### Task 3: Home Screen — Show PaniCafe Rewards Instead of Bondum

Bondum rewards are not yet redeemable (only PaniCafe ones work). Showing unredeemable rewards is misleading. Change the home screen featured carousel to show PaniCafe rewards.

**Files:**
- Modify: `src/app/(tabs)/(home)/index.tsx:33,71,239-249`

**Step 1: Switch from Bondum to PaniCafe rewards**

Change line 33:
```typescript
// Before:
const { rewards, refetch: refetchRewards } = useRewards('Bondum')
// After:
const { rewards, refetch: refetchRewards } = useRewards('PaniCafe')
```

**Step 2: Replace red card with PaniCafe-branded card**

Replace the featured reward card (lines 239-249) to use PaniCafe brand colors (warm orange/amber) instead of aggressive red:

```tsx
{featuredRewards.map((reward) => (
  <View key={reward.id} className="mr-3 w-[75%] bg-gray-100 rounded-3xl" style={{ borderWidth: 1, borderColor: '#9b9db5', padding: 18.52 }}>
    <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
      <Text className="text-violet-500 text-lg font-bold">{t('common.reward')}</Text>
      <Badge variant="outline">{t('common.available', { count: reward.available })}</Badge>
    </View>
    <Text className="text-gray-900 font-semibold mb-3">{reward.title}</Text>
    <View className="bg-violet-600 rounded-xl items-center" style={{ paddingVertical: 37.04 }}>
      <Text className="text-white text-5xl font-extrabold">{reward.value}</Text>
    </View>
  </View>
))}
```

Key changes:
- `bg-red-600` → `bg-violet-600` (brand-consistent)
- `text-7xl` → `text-5xl` (PaniCafe values like "CAFÉ GRATIS" are longer text, need smaller font)

**Step 3: Commit**

```bash
git add src/app/(tabs)/(home)/index.tsx
git commit -m "feat: show PaniCafe rewards on home (Bondum rewards not yet live)"
```

---

### Task 4: Add "Próximamente" Badge to Bondum Rewards

On the Rewards screen (Premios tab), Bondum rewards should be marked as "Coming Soon" so users don't try to redeem them.

**Files:**
- Modify: `src/app/(tabs)/(rewards)/index.tsx:50-58`
- Modify: `src/i18n/en.ts` (add `rewards.comingSoon` key)
- Modify: `src/i18n/es.ts` (add `rewards.comingSoon` key)

**Step 1: Add i18n keys**

In `src/i18n/en.ts`, add to the `rewards` section:
```typescript
comingSoon: 'Coming Soon',
```

In `src/i18n/es.ts`, add to the `rewards` section:
```typescript
comingSoon: 'Próximamente',
```

**Step 2: Update Bondum brand card on Rewards screen**

Replace the Bondum brand card (lines 51-58) to show a "Coming Soon" badge:

```tsx
{/* Bondum Row — Coming Soon */}
<Pressable
  onPress={() => setViewMode('bondum')}
  className="flex-row items-center mb-6 bg-white rounded-2xl p-5"
  style={{ borderWidth: 1, borderColor: '#9b9db5', opacity: 0.7 }}
>
  <Image source={bLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
  <Text className="text-gray-900 font-bold text-lg ml-4 flex-1">{t('rewards.bondumRewards')}</Text>
  <View className="bg-violet-100 rounded-lg px-3 py-1">
    <Text className="text-violet-500 text-xs font-bold">{t('rewards.comingSoon')}</Text>
  </View>
</Pressable>
```

**Step 3: Commit**

```bash
git add src/app/(tabs)/(rewards)/index.tsx src/i18n/en.ts src/i18n/es.ts
git commit -m "feat: mark Bondum rewards as Coming Soon on rewards screen"
```

---

### Task 5: Consistent Username Truncation

Username is truncated at 20 chars on Home, 16 chars on Header component and Profile. Standardize to 18 chars everywhere.

**Files:**
- Modify: `src/app/(tabs)/(home)/index.tsx:86`
- Modify: `src/app/(tabs)/(profile)/index.tsx:54`
- Modify: `src/components/layout/Header.tsx:58`

**Step 1: Fix Home screen**

Line 86 — change `> 20` to `> 18` and `.slice(0, 20)` to `.slice(0, 18)`:

```tsx
{(user?.username || 'User').length > 18 ? (user?.username || 'User').slice(0, 18) + '...' : user?.username || 'User'}
```

**Step 2: Fix Profile screen**

Line 54 — change `> 16` to `> 18` and `.slice(0, 16)` to `.slice(0, 18)`:

```tsx
<Text className="text-white text-6xl font-extrabold" numberOfLines={1}>{(user?.username || 'User').length > 18 ? (user?.username || 'User').slice(0, 18) + '...' : user?.username || 'User'}</Text>
```

**Step 3: Fix Header component**

Line 58 — change `> 16` to `> 18` and `.slice(0, 16)` to `.slice(0, 18)`:

```tsx
<Text className="text-white font-bold" style={{ fontSize: fontSize['2xl'] }} numberOfLines={1}>{t('header.hello', { name: userName.length > 18 ? userName.slice(0, 18) + '...' : userName })}</Text>
```

**Step 4: Commit**

```bash
git add src/app/(tabs)/(home)/index.tsx src/app/(tabs)/(profile)/index.tsx src/components/layout/Header.tsx
git commit -m "fix: consistent username truncation at 18 chars across all screens"
```

---

### Task 6: Polish NFT Empty State

The wallet/assets screen shows plain colored rectangles when there are no NFTs. Replace with a more intentional empty state.

**Files:**
- Modify: `src/app/(tabs)/(assets)/index.tsx:94-100`

**Step 1: Replace colored blocks with styled empty state**

Replace lines 94-100:

```tsx
{nftCount === 0 && !isNftsLoading && (
  <View className="flex-row items-center justify-center py-4" style={{ gap: 10 }}>
    <View className="rounded-xl bg-violet-100 items-center justify-center" style={{ width: 72, height: 72 }}>
      <Text style={{ fontSize: 28 }}>{'\uD83D\uDDBC\uFE0F'}</Text>
    </View>
    <View className="rounded-xl bg-violet-50 items-center justify-center" style={{ width: 72, height: 72 }}>
      <Text style={{ fontSize: 28 }}>{'\u2728'}</Text>
    </View>
    <View className="rounded-xl bg-violet-100 items-center justify-center" style={{ width: 72, height: 72 }}>
      <Text style={{ fontSize: 28 }}>{'\uD83C\uDFA8'}</Text>
    </View>
  </View>
)}
```

**Step 2: Commit**

```bash
git add src/app/(tabs)/(assets)/index.tsx
git commit -m "fix: polish NFT empty state with icons instead of blank colored blocks"
```

---

### Task 7: Fix Red Reward Cards on Rewards Detail Screen

The rewards detail view also uses `bg-red-600` for Bondum reward cards. Update to use brand-consistent violet.

**Files:**
- Modify: `src/app/(tabs)/(rewards)/index.tsx:98-101`

**Step 1: Replace red with violet for Bondum rewards**

Change line 99:
```tsx
// Before:
className={`rounded-xl py-10 items-center ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-red-600'}`}
// After:
className={`rounded-xl py-10 items-center ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-violet-600'}`}
```

**Step 2: Commit**

```bash
git add src/app/(tabs)/(rewards)/index.tsx
git commit -m "fix: replace red reward cards with brand-consistent violet"
```

---

### Task 8: Build and Install on Seeker

**Step 1: Build release APK**

```bash
cd android && ./gradlew assembleRelease
```

**Step 2: Install on Seeker**

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Step 3: Verify all screens**

- [ ] Home screen: PaniCafe rewards shown, violet cards, Spanish descriptions
- [ ] Scan screen: Spanish fallback text
- [ ] Rewards screen: Bondum shows "Próximamente", PaniCafe works
- [ ] Wallet: NFT empty state with icons
- [ ] Settings: Language switch works
- [ ] Profile: Username truncated at 18 chars

---

## Advisory: Bondum Rewards Strategy

Since only PaniCafe rewards are live, here's what the app should communicate:

1. **Home screen** — Feature PaniCafe rewards (the ones users can actually redeem)
2. **Rewards screen** — Bondum marked "Próximamente" with reduced opacity
3. **Bondum reward detail** — Users can still browse but can't redeem (the server will reject anyway). Consider adding a "Coming Soon" overlay in a future update.

This is honest UX: show what works, tease what's coming. For the hackathon demo, highlight the PaniCafe flow since it's the live, on-chain proof of the system working.
