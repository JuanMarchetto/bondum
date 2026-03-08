/**
 * Pure streak, multiplier, milestone, daily challenge, and recommendation logic.
 *
 * Exported so that both the server and tests can import the same code
 * instead of copy-pasting.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StreakEntry {
  currentStreak: number
  longestStreak: number
  lastScanDate: string | null
  totalScans: number
  challengeProgress?: Record<string, number>
}

export interface Milestone {
  days: number
  bonus: number
  label: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const STREAK_MILESTONES: Milestone[] = [
  { days: 3, bonus: 50, label: '3-day streak' },
  { days: 7, bonus: 200, label: '7-day streak' },
  { days: 14, bonus: 500, label: '14-day streak' },
  { days: 30, bonus: 2000, label: '30-day streak' },
]

export const CHALLENGES = [
  { type: 'scan', description: 'Scan 2 QR codes today', reward: 100, target: 2 },
  { type: 'explore', description: 'Check out 3 rewards', reward: 75, target: 3 },
  { type: 'scan', description: 'Scan a PaniCafe QR code', reward: 150, target: 1 },
  { type: 'streak', description: 'Maintain your streak', reward: 100, target: 1 },
  { type: 'scan', description: 'Earn 500+ tokens from scans', reward: 200, target: 500 },
  { type: 'explore', description: 'Visit the rewards marketplace', reward: 50, target: 1 },
  { type: 'scan', description: 'Scan 3 QR codes today', reward: 150, target: 3 },
]

// ─── Reward Catalog ──────────────────────────────────────────────────────────

export const rewardCatalog = [
  // Bondum rewards
  { id: '1', brand: 'Bondum', type: 'discount', title: '40% discount on your next purchase', description: '40% discount on your next purchase of any product', value: '40% OFF', cost: 5000, available: 3 },
  { id: '2', brand: 'Bondum', type: 'discount', title: '15% discount on your next purchase of the product', description: '15% discount on your next purchase of the product', value: '15% OFF', cost: 10000, available: 3 },
  { id: '3', brand: 'Bondum', type: 'token', title: 'Bonus $BONDUM tokens', description: 'Receive 500 bonus $BONDUM tokens', value: '500 $BONDUM', cost: 2000, available: 10, tokenAmount: 500 },
  { id: '4', brand: 'Bondum', type: 'nft', title: 'Exclusive Bondum NFT', description: 'An exclusive ultra rare Bondum NFT for your collection', value: 'ULTRA RARE NFT', cost: 15000, available: 1 },
  // PaniCafe real product rewards (ported from PaniCafe production with ~8,000 users)
  { id: 'pc-1', brand: 'PaniCafe', type: 'discount', title: 'Free Coffee with any pastry purchase', description: 'Get a free coffee when you buy any pastry at PaniCafe', value: 'FREE COFFEE', cost: 1000, available: 5 },
  { id: 'pc-2', brand: 'PaniCafe', type: 'discount', title: '25% off any drink', description: '25% discount on any drink at PaniCafe', value: '25% OFF', cost: 2000, available: 3 },
  { id: 'pc-3', brand: 'PaniCafe', type: 'token', title: 'Bonus PaniCafe tokens', description: 'Receive 200 bonus PANICAFE tokens', value: '200 PANICAFE', cost: 500, available: 10, tokenAmount: 200 },
  { id: 'pc-4', brand: 'PaniCafe', type: 'discount', title: '50% off pastry of the day', description: '50% discount on the pastry of the day', value: '50% OFF', cost: 3000, available: 2 },
  { id: 'pc-5', brand: 'PaniCafe', type: 'discount', title: 'Free Café', description: 'Redeem for a free Café at any PaniCafe location', value: 'FREE CAFÉ', cost: 30000, available: 5 },
  { id: 'pc-6', brand: 'PaniCafe', type: 'discount', title: 'Free Medialuna or Factura', description: 'Redeem for a free Medialuna or Factura pastry', value: 'MEDIALUNA', cost: 20000, available: 8 },
  { id: 'pc-7', brand: 'PaniCafe', type: 'discount', title: 'Free Croissant', description: 'Redeem for a free Croissant at PaniCafe', value: 'CROISSANT', cost: 40000, available: 4 },
  { id: 'pc-8', brand: 'PaniCafe', type: 'discount', title: 'Free Jugo Natural', description: 'Redeem for a fresh natural juice at PaniCafe', value: 'JUGO NATURAL', cost: 40000, available: 4 },
  { id: 'pc-9', brand: 'PaniCafe', type: 'discount', title: 'Desayuno Tradicional', description: 'Redeem for a full traditional breakfast at PaniCafe', value: 'DESAYUNO', cost: 70000, available: 2 },
  { id: 'pc-10', brand: 'PaniCafe', type: 'discount', title: 'Helado Dos Bochas', description: 'Redeem for a two-scoop ice cream at PaniCafe', value: 'HELADO', cost: 50000, available: 3 },
  { id: 'pc-11', brand: 'PaniCafe', type: 'discount', title: '1/4 Kilo de Helado', description: 'Redeem for a quarter kilo of ice cream', value: '1/4 KG HELADO', cost: 80000, available: 2 },
]

// ─── Pure Functions ──────────────────────────────────────────────────────────

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getMultiplier(currentStreak: number): number {
  return 1.0 + Math.min(currentStreak * 0.1, 1.0)
}

export function getNextMilestone(currentStreak: number): Milestone | null {
  for (const m of STREAK_MILESTONES) {
    if (currentStreak < m.days) return m
  }
  return null
}

export function freshStreak(): StreakEntry {
  return { currentStreak: 0, longestStreak: 0, lastScanDate: null, totalScans: 0 }
}

/**
 * Pure streak update — accepts the current date as a parameter
 * so it can be tested deterministically.
 */
export function updateStreakPure(
  streak: StreakEntry,
  today: string,
): { streak: StreakEntry; milestoneReached: string | null; milestoneBonus: number } {
  streak.totalScans++

  if (streak.lastScanDate === today) {
    return { streak, milestoneReached: null, milestoneBonus: 0 }
  }

  if (streak.lastScanDate) {
    const lastDate = new Date(streak.lastScanDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    streak.currentStreak = diffDays === 1 ? streak.currentStreak + 1 : 1
  } else {
    streak.currentStreak = 1
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak
  }
  streak.lastScanDate = today

  let milestoneReached: string | null = null
  let milestoneBonus = 0
  for (const m of STREAK_MILESTONES) {
    if (streak.currentStreak === m.days) {
      milestoneReached = m.label
      milestoneBonus = m.bonus
      break
    }
  }

  return { streak, milestoneReached, milestoneBonus }
}

export function getDailyChallenge(now?: Date): {
  type: string
  description: string
  reward: number
  target: number
  dayOfYear: number
} {
  const date = now || new Date()
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  const challenge = CHALLENGES[dayOfYear % CHALLENGES.length]
  return { ...challenge, dayOfYear }
}

export function generateRecommendation(
  params: { walletAddress: string; streak: number; balance: number },
  catalog: Array<{ id: string; brand: string; title: string; cost: number; available: number }>,
): { recommendation: string; reasoning: string; suggestedReward: string | null; urgency: 'low' | 'medium' | 'high' } {
  const { streak, balance } = params
  const nextMilestone = getNextMilestone(streak)
  const multiplier = getMultiplier(streak)

  if (streak >= 7) {
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0
    const reward = catalog.find((r) => r.brand === 'PaniCafe' && balance >= r.cost && r.available > 0)
    return {
      recommendation: reward
        ? `Your ${streak}-day streak earns ${multiplier.toFixed(1)}x multiplier! You have enough for "${reward.title}" — redeem before it runs out (${reward.available} left).`
        : `Your ${streak}-day streak earns ${multiplier.toFixed(1)}x on all scans! ${daysToNext > 0 ? `${daysToNext} days to ${nextMilestone!.label} for +${nextMilestone!.bonus} bonus tokens.` : 'Keep going!'}`,
      reasoning: 'High engagement user — encourage continued streaks and spending.',
      suggestedReward: reward?.id || null,
      urgency: reward ? 'high' : 'medium',
    }
  }

  if (balance >= 20000) {
    const affordable = catalog
      .filter((r) => balance >= r.cost && r.available > 0)
      .sort((a, b) => b.cost - a.cost)
    const bestReward = affordable[0]
    if (bestReward) {
      return {
        recommendation: `You have ${balance.toLocaleString()} tokens — enough for "${bestReward.title}"! Redeem it before stock runs out (${bestReward.available} left).`,
        reasoning: 'User has enough balance for high-value rewards.',
        suggestedReward: bestReward.id,
        urgency: 'high',
      }
    }
  }

  if (streak > 0 && streak < 7) {
    const daysToSeven = 7 - streak
    return {
      recommendation: `${daysToSeven} more days to a 7-day streak bonus of +200 tokens! Keep scanning daily to earn ${multiplier.toFixed(1)}x on all rewards.`,
      reasoning: 'User has an active streak — encourage them toward 7-day milestone.',
      suggestedReward: null,
      urgency: 'medium',
    }
  }

  return {
    recommendation: 'Start a streak today! Scan a QR code to earn tokens with a 1.1x multiplier — and work toward the 3-day bonus of +50 tokens.',
    reasoning: 'New or lapsed user — motivate first scan.',
    suggestedReward: null,
    urgency: 'low',
  }
}

/**
 * Update daily challenge progress for a given address.
 * Returns the updated progress count and whether the challenge is completed.
 */
export function updateChallengeProgress(
  streak: StreakEntry,
  challengeType: string,
  increment: number,
  target: number,
): { progress: number; completed: boolean } {
  if (!streak.challengeProgress) {
    streak.challengeProgress = {}
  }
  const dateKey = getDateString(new Date())
  const key = `${dateKey}:${challengeType}`
  const prev = streak.challengeProgress[key] || 0
  streak.challengeProgress[key] = prev + increment

  // Clean up old entries (keep only today's)
  for (const k of Object.keys(streak.challengeProgress)) {
    if (!k.startsWith(dateKey)) {
      delete streak.challengeProgress[k]
    }
  }

  return {
    progress: streak.challengeProgress[key],
    completed: streak.challengeProgress[key] >= target,
  }
}
