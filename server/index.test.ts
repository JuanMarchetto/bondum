/**
 * Tests for Bondum Reward Server logic
 *
 * Uses Node.js built-in test runner (node:test) and assertion library (node:assert).
 * Pure functions are copied from the server to unit-test without exports.
 * No external test framework required.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// ─── Copied pure functions from index.ts ────────────────────────────────────

// Streak milestones (same as server)
const STREAK_MILESTONES = [
  { days: 3, bonus: 50, label: '3-day streak' },
  { days: 7, bonus: 200, label: '7-day streak' },
  { days: 14, bonus: 500, label: '14-day streak' },
  { days: 30, bonus: 2000, label: '30-day streak' },
]

function getMultiplier(currentStreak: number): number {
  return 1.0 + Math.min(currentStreak * 0.1, 1.0)
}

function getNextMilestone(
  currentStreak: number,
): { days: number; bonus: number; label: string } | null {
  for (const m of STREAK_MILESTONES) {
    if (currentStreak < m.days) return m
  }
  return null
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Streak entry type
interface StreakEntry {
  currentStreak: number
  longestStreak: number
  lastScanDate: string | null
  totalScans: number
}

// updateStreak logic replicated with injectable "today" for deterministic tests
function updateStreakPure(
  streak: StreakEntry,
  today: string,
): {
  streak: StreakEntry
  milestoneReached: string | null
  milestoneBonus: number
} {
  streak.totalScans++

  if (streak.lastScanDate === today) {
    return { streak, milestoneReached: null, milestoneBonus: 0 }
  }

  if (streak.lastScanDate) {
    const lastDate = new Date(streak.lastScanDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    streak.currentStreak = diffDays === 1 ? streak.currentStreak + 1 : 1
  } else {
    streak.currentStreak = 1
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak
  }
  streak.lastScanDate = today

  // Check milestones
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

// Daily challenge logic
const CHALLENGES = [
  { type: 'scan', description: 'Scan 2 QR codes today', reward: 100, target: 2 },
  { type: 'share', description: 'Share your referral code', reward: 50, target: 1 },
  { type: 'explore', description: 'Check out 3 rewards', reward: 75, target: 3 },
  { type: 'scan', description: 'Scan a PaniCafe QR code', reward: 150, target: 1 },
  { type: 'streak', description: 'Maintain your streak', reward: 100, target: 1 },
  { type: 'scan', description: 'Earn 500+ tokens from scans', reward: 200, target: 500 },
  {
    type: 'explore',
    description: 'Visit the rewards marketplace',
    reward: 50,
    target: 1,
  },
]

function getDailyChallenge(): {
  type: string
  description: string
  reward: number
  target: number
  dayOfYear: number
} {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  const challenge = CHALLENGES[dayOfYear % CHALLENGES.length]
  return { ...challenge, dayOfYear }
}

// Reward catalog (same as server)
const rewardCatalog = [
  // Bondum rewards
  {
    id: '1',
    brand: 'Bondum',
    type: 'discount',
    title: '40% discount on your next purchase',
    description: '40% discount on your next purchase of any product',
    value: '40% OFF',
    cost: 5000,
    available: 3,
  },
  {
    id: '2',
    brand: 'Bondum',
    type: 'discount',
    title: '15% discount on your next purchase of the product',
    description: '15% discount on your next purchase of the product',
    value: '15% OFF',
    cost: 10000,
    available: 3,
  },
  {
    id: '3',
    brand: 'Bondum',
    type: 'token',
    title: 'Bonus $BONDUM tokens',
    description: 'Receive 500 bonus $BONDUM tokens',
    value: '500 $BONDUM',
    cost: 2000,
    available: 10,
    tokenAmount: 500,
  },
  {
    id: '4',
    brand: 'Bondum',
    type: 'nft',
    title: 'Exclusive Bondum NFT',
    description: 'An exclusive ultra rare Bondum NFT for your collection',
    value: 'ULTRA RARE NFT',
    cost: 15000,
    available: 1,
  },

  // PaniCafe rewards
  {
    id: 'pc-1',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Free Coffee with any pastry purchase',
    description: 'Get a free coffee when you buy any pastry at PaniCafe',
    value: 'FREE COFFEE',
    cost: 1000,
    available: 5,
  },
  {
    id: 'pc-2',
    brand: 'PaniCafe',
    type: 'discount',
    title: '25% off any drink',
    description: '25% discount on any drink at PaniCafe',
    value: '25% OFF',
    cost: 2000,
    available: 3,
  },
  {
    id: 'pc-3',
    brand: 'PaniCafe',
    type: 'token',
    title: 'Bonus PaniCafe tokens',
    description: 'Receive 200 bonus PANICAFE tokens',
    value: '200 PANICAFE',
    cost: 500,
    available: 10,
    tokenAmount: 200,
  },
  {
    id: 'pc-4',
    brand: 'PaniCafe',
    type: 'discount',
    title: '50% off pastry of the day',
    description: '50% discount on the pastry of the day',
    value: '50% OFF',
    cost: 3000,
    available: 2,
  },
  {
    id: 'pc-5',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Free Café',
    description: 'Redeem for a free Café at any PaniCafe location',
    value: 'FREE CAFÉ',
    cost: 30000,
    available: 5,
  },
  {
    id: 'pc-6',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Free Medialuna or Factura',
    description: 'Redeem for a free Medialuna or Factura pastry',
    value: 'MEDIALUNA',
    cost: 20000,
    available: 8,
  },
  {
    id: 'pc-7',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Free Croissant',
    description: 'Redeem for a free Croissant at PaniCafe',
    value: 'CROISSANT',
    cost: 40000,
    available: 4,
  },
  {
    id: 'pc-8',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Free Jugo Natural',
    description: 'Redeem for a fresh natural juice at PaniCafe',
    value: 'JUGO NATURAL',
    cost: 40000,
    available: 4,
  },
  {
    id: 'pc-9',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Desayuno Tradicional',
    description: 'Redeem for a full traditional breakfast at PaniCafe',
    value: 'DESAYUNO',
    cost: 70000,
    available: 2,
  },
  {
    id: 'pc-10',
    brand: 'PaniCafe',
    type: 'discount',
    title: 'Helado Dos Bochas',
    description: 'Redeem for a two-scoop ice cream at PaniCafe',
    value: 'HELADO',
    cost: 50000,
    available: 3,
  },
  {
    id: 'pc-11',
    brand: 'PaniCafe',
    type: 'discount',
    title: '1/4 Kilo de Helado',
    description: 'Redeem for a quarter kilo of ice cream',
    value: '1/4 KG HELADO',
    cost: 80000,
    available: 2,
  },
]

// AI recommendation engine (same as server)
function generateRecommendation(params: {
  walletAddress: string
  streak: number
  balance: number
}): {
  recommendation: string
  reasoning: string
  suggestedReward: string | null
  urgency: 'low' | 'medium' | 'high'
} {
  const { streak, balance } = params
  const nextMilestone = getNextMilestone(streak)
  const multiplier = getMultiplier(streak)

  // High engagement path
  if (streak >= 7) {
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0
    const reward = rewardCatalog.find(
      (r) => r.brand === 'PaniCafe' && balance >= r.cost && r.available > 0,
    )
    return {
      recommendation: reward
        ? `Your ${streak}-day streak earns ${multiplier.toFixed(1)}x multiplier! You have enough for "${reward.title}" — redeem before it runs out (${reward.available} left).`
        : `Your ${streak}-day streak earns ${multiplier.toFixed(1)}x on all scans! ${daysToNext > 0 ? `${daysToNext} days to ${nextMilestone!.label} for +${nextMilestone!.bonus} bonus tokens.` : 'Keep going!'}`,
      reasoning: 'High engagement user — encourage continued streaks and spending.',
      suggestedReward: reward?.id || null,
      urgency: reward ? 'high' : 'medium',
    }
  }

  // Can afford a reward
  if (balance >= 20000) {
    const affordable = rewardCatalog
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

  // Streak building
  if (streak > 0 && streak < 7) {
    const daysToSeven = 7 - streak
    return {
      recommendation: `${daysToSeven} more days to a 7-day streak bonus of +200 tokens! Keep scanning daily to earn ${multiplier.toFixed(1)}x on all rewards.`,
      reasoning: 'User has an active streak — encourage them toward 7-day milestone.',
      suggestedReward: null,
      urgency: 'medium',
    }
  }

  // New or lapsed user
  return {
    recommendation:
      'Start a streak today! Scan a QR code to earn tokens with a 1.1x multiplier — and work toward the 3-day bonus of +50 tokens.',
    reasoning: 'New or lapsed user — motivate first scan.',
    suggestedReward: null,
    urgency: 'low',
  }
}

// ─── Helper: create a fresh streak entry ────────────────────────────────────

function freshStreak(): StreakEntry {
  return { currentStreak: 0, longestStreak: 0, lastScanDate: null, totalScans: 0 }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Streak logic', () => {
  it('first scan creates streak of 1', () => {
    const streak = freshStreak()
    const result = updateStreakPure(streak, '2025-06-01')

    assert.equal(result.streak.currentStreak, 1)
    assert.equal(result.streak.lastScanDate, '2025-06-01')
    assert.equal(result.streak.totalScans, 1)
  })

  it('same-day scan does not increment streak', () => {
    const streak = freshStreak()
    updateStreakPure(streak, '2025-06-01')
    const result = updateStreakPure(streak, '2025-06-01')

    assert.equal(result.streak.currentStreak, 1)
    assert.equal(result.streak.totalScans, 2)
    assert.equal(result.milestoneReached, null)
    assert.equal(result.milestoneBonus, 0)
  })

  it('consecutive day increments streak', () => {
    const streak = freshStreak()
    updateStreakPure(streak, '2025-06-01')
    const result = updateStreakPure(streak, '2025-06-02')

    assert.equal(result.streak.currentStreak, 2)
    assert.equal(result.streak.longestStreak, 2)
    assert.equal(result.streak.totalScans, 2)
  })

  it('skipped day resets streak to 1', () => {
    const streak = freshStreak()
    updateStreakPure(streak, '2025-06-01')
    updateStreakPure(streak, '2025-06-02')
    const result = updateStreakPure(streak, '2025-06-04') // skipped June 3

    assert.equal(result.streak.currentStreak, 1)
    // longestStreak should still be 2 from the earlier run
    assert.equal(result.streak.longestStreak, 2)
  })

  it('longestStreak tracks the highest streak seen', () => {
    const streak = freshStreak()
    updateStreakPure(streak, '2025-06-01')
    updateStreakPure(streak, '2025-06-02')
    updateStreakPure(streak, '2025-06-03')
    // Break the streak
    updateStreakPure(streak, '2025-06-05')

    assert.equal(streak.currentStreak, 1)
    assert.equal(streak.longestStreak, 3)
  })

  describe('multiplier calculation', () => {
    it('streak 0 gives 1.0x', () => {
      assert.equal(getMultiplier(0), 1.0)
    })

    it('streak 1 gives 1.1x', () => {
      assert.equal(getMultiplier(1), 1.1)
    })

    it('streak 5 gives 1.5x', () => {
      assert.equal(getMultiplier(5), 1.5)
    })

    it('streak 10 gives 2.0x (capped)', () => {
      assert.equal(getMultiplier(10), 2.0)
    })

    it('streak 15 still gives 2.0x (max cap)', () => {
      assert.equal(getMultiplier(15), 2.0)
    })

    it('streak 100 still gives 2.0x (max cap)', () => {
      assert.equal(getMultiplier(100), 2.0)
    })

    it('formula is 1.0 + min(streak * 0.1, 1.0)', () => {
      for (let s = 0; s <= 20; s++) {
        const expected = 1.0 + Math.min(s * 0.1, 1.0)
        assert.equal(getMultiplier(s), expected, `Failed for streak=${s}`)
      }
    })
  })

  describe('milestone detection', () => {
    it('detects 3-day milestone', () => {
      const streak = freshStreak()
      updateStreakPure(streak, '2025-06-01')
      updateStreakPure(streak, '2025-06-02')
      const result = updateStreakPure(streak, '2025-06-03')

      assert.equal(result.milestoneReached, '3-day streak')
      assert.equal(result.milestoneBonus, 50)
    })

    it('detects 7-day milestone', () => {
      const streak = freshStreak()
      for (let day = 1; day <= 7; day++) {
        const dateStr = `2025-06-${String(day).padStart(2, '0')}`
        var result = updateStreakPure(streak, dateStr)
      }

      assert.equal(result!.milestoneReached, '7-day streak')
      assert.equal(result!.milestoneBonus, 200)
    })

    it('detects 14-day milestone', () => {
      const streak = freshStreak()
      let result
      for (let day = 1; day <= 14; day++) {
        const dateStr = `2025-06-${String(day).padStart(2, '0')}`
        result = updateStreakPure(streak, dateStr)
      }

      assert.equal(result!.milestoneReached, '14-day streak')
      assert.equal(result!.milestoneBonus, 500)
    })

    it('detects 30-day milestone', () => {
      const streak = freshStreak()
      let result
      // June has 30 days, so we go from June 1 to June 30
      for (let day = 1; day <= 30; day++) {
        const dateStr = `2025-06-${String(day).padStart(2, '0')}`
        result = updateStreakPure(streak, dateStr)
      }

      assert.equal(result!.milestoneReached, '30-day streak')
      assert.equal(result!.milestoneBonus, 2000)
    })

    it('no milestone on non-milestone days', () => {
      const streak = freshStreak()
      updateStreakPure(streak, '2025-06-01')
      const result = updateStreakPure(streak, '2025-06-02')

      assert.equal(result.milestoneReached, null)
      assert.equal(result.milestoneBonus, 0)
    })
  })

  describe('getNextMilestone', () => {
    it('streak 0 next milestone is 3-day', () => {
      const next = getNextMilestone(0)
      assert.deepEqual(next, { days: 3, bonus: 50, label: '3-day streak' })
    })

    it('streak 3 next milestone is 7-day', () => {
      const next = getNextMilestone(3)
      assert.deepEqual(next, { days: 7, bonus: 200, label: '7-day streak' })
    })

    it('streak 7 next milestone is 14-day', () => {
      const next = getNextMilestone(7)
      assert.deepEqual(next, { days: 14, bonus: 500, label: '14-day streak' })
    })

    it('streak 14 next milestone is 30-day', () => {
      const next = getNextMilestone(14)
      assert.deepEqual(next, { days: 30, bonus: 2000, label: '30-day streak' })
    })

    it('streak 30 has no next milestone', () => {
      const next = getNextMilestone(30)
      assert.equal(next, null)
    })

    it('streak 50 has no next milestone', () => {
      const next = getNextMilestone(50)
      assert.equal(next, null)
    })
  })
})

describe('Daily challenge', () => {
  it('returns a valid challenge object', () => {
    const challenge = getDailyChallenge()

    assert.ok(challenge.type, 'challenge must have a type')
    assert.ok(challenge.description, 'challenge must have a description')
    assert.ok(typeof challenge.reward === 'number', 'reward must be a number')
    assert.ok(challenge.reward > 0, 'reward must be positive')
    assert.ok(typeof challenge.target === 'number', 'target must be a number')
    assert.ok(challenge.target > 0, 'target must be positive')
    assert.ok(typeof challenge.dayOfYear === 'number', 'dayOfYear must be a number')
  })

  it('type is one of the known challenge types', () => {
    const challenge = getDailyChallenge()
    const validTypes = ['scan', 'share', 'explore', 'streak']
    assert.ok(
      validTypes.includes(challenge.type),
      `type "${challenge.type}" must be one of ${validTypes.join(', ')}`,
    )
  })

  it('dayOfYear is deterministic for a given day', () => {
    const a = getDailyChallenge()
    const b = getDailyChallenge()
    assert.equal(a.dayOfYear, b.dayOfYear)
    assert.equal(a.type, b.type)
    assert.equal(a.description, b.description)
  })
})

describe('AI recommendation engine', () => {
  it('new user (streak=0, balance=0) gets "start a streak" message', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-new',
      streak: 0,
      balance: 0,
    })

    assert.ok(
      result.recommendation.includes('Start a streak'),
      `Expected "Start a streak" in: "${result.recommendation}"`,
    )
    assert.equal(result.urgency, 'low')
    assert.equal(result.suggestedReward, null)
  })

  it('building-streak user (streak=4) gets encouragement toward 7-day milestone', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-building',
      streak: 4,
      balance: 0,
    })

    assert.ok(
      result.recommendation.includes('7-day streak'),
      `Expected "7-day streak" in: "${result.recommendation}"`,
    )
    assert.equal(result.urgency, 'medium')
    assert.equal(result.suggestedReward, null)
  })

  it('high-streak user (streak=10) gets multiplier info', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-high-streak',
      streak: 10,
      balance: 0,
    })

    // The multiplier for streak 10 is 2.0
    assert.ok(
      result.recommendation.includes('2.0x'),
      `Expected "2.0x" multiplier in: "${result.recommendation}"`,
    )
    assert.ok(
      result.recommendation.includes('10-day streak'),
      `Expected "10-day streak" in: "${result.recommendation}"`,
    )
    assert.equal(result.urgency, 'medium')
  })

  it('high-streak user with enough balance gets reward suggestion', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-high-streak-balance',
      streak: 10,
      balance: 50000,
    })

    assert.ok(result.suggestedReward !== null, 'should suggest a reward')
    assert.equal(result.urgency, 'high')
    // The suggested reward should be a PaniCafe reward they can afford
    const suggested = rewardCatalog.find((r) => r.id === result.suggestedReward)
    assert.ok(suggested, 'suggested reward must exist in catalog')
    assert.equal(suggested!.brand, 'PaniCafe')
  })

  it('high-balance user (no streak) gets reward suggestion', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-high-balance',
      streak: 0,
      balance: 100000,
    })

    assert.ok(result.suggestedReward !== null, 'should suggest a reward')
    assert.equal(result.urgency, 'high')
    assert.ok(
      result.recommendation.includes('100,000 tokens'),
      `Expected formatted balance in: "${result.recommendation}"`,
    )
  })

  it('high-balance user gets the most expensive affordable reward', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-rich',
      streak: 0,
      balance: 100000,
    })

    // With 100,000 balance and streak=0 (non-high-engagement path),
    // the most expensive affordable reward is pc-11 at 80,000
    const suggested = rewardCatalog.find((r) => r.id === result.suggestedReward)
    assert.ok(suggested, 'suggested reward must exist')
    assert.equal(suggested!.id, 'pc-11')
    assert.equal(suggested!.cost, 80000)
  })
})

describe('Reward catalog', () => {
  it('has both Bondum and PaniCafe rewards', () => {
    const bondumRewards = rewardCatalog.filter((r) => r.brand === 'Bondum')
    const paniCafeRewards = rewardCatalog.filter((r) => r.brand === 'PaniCafe')

    assert.ok(bondumRewards.length > 0, 'should have Bondum rewards')
    assert.ok(paniCafeRewards.length > 0, 'should have PaniCafe rewards')
  })

  it('has exactly 4 Bondum rewards', () => {
    const bondumRewards = rewardCatalog.filter((r) => r.brand === 'Bondum')
    assert.equal(bondumRewards.length, 4)
  })

  it('has exactly 11 PaniCafe rewards', () => {
    const paniCafeRewards = rewardCatalog.filter((r) => r.brand === 'PaniCafe')
    assert.equal(paniCafeRewards.length, 11)
  })

  it('PaniCafe has real product items', () => {
    const paniCafeRewards = rewardCatalog.filter((r) => r.brand === 'PaniCafe')
    const titles = paniCafeRewards.map((r) => r.title)

    assert.ok(
      titles.some((t) => t.includes('Café')),
      'should have a Café reward',
    )
    assert.ok(
      titles.some((t) => t.includes('Medialuna')),
      'should have a Medialuna reward',
    )
    assert.ok(
      titles.some((t) => t.includes('Croissant')),
      'should have a Croissant reward',
    )
    assert.ok(
      titles.some((t) => t.includes('Jugo Natural')),
      'should have a Jugo Natural reward',
    )
    assert.ok(
      titles.some((t) => t.includes('Desayuno')),
      'should have a Desayuno reward',
    )
    assert.ok(
      titles.some((t) => t.includes('Helado')),
      'should have a Helado reward',
    )
  })

  it('all rewards have required fields', () => {
    for (const reward of rewardCatalog) {
      assert.ok(reward.id, `reward must have id`)
      assert.ok(reward.brand, `reward ${reward.id} must have brand`)
      assert.ok(reward.type, `reward ${reward.id} must have type`)
      assert.ok(reward.title, `reward ${reward.id} must have title`)
      assert.ok(reward.description, `reward ${reward.id} must have description`)
      assert.ok(reward.value, `reward ${reward.id} must have value`)
      assert.ok(typeof reward.cost === 'number', `reward ${reward.id} cost must be a number`)
      assert.ok(reward.cost > 0, `reward ${reward.id} cost must be positive`)
      assert.ok(
        typeof reward.available === 'number',
        `reward ${reward.id} available must be a number`,
      )
      assert.ok(reward.available >= 0, `reward ${reward.id} available must be non-negative`)
    }
  })

  it('all reward IDs are unique', () => {
    const ids = rewardCatalog.map((r) => r.id)
    const uniqueIds = new Set(ids)
    assert.equal(ids.length, uniqueIds.size, 'all reward IDs must be unique')
  })

  it('token rewards have tokenAmount field', () => {
    const tokenRewards = rewardCatalog.filter((r) => r.type === 'token')
    assert.ok(tokenRewards.length > 0, 'should have token rewards')
    for (const reward of tokenRewards) {
      assert.ok(
        (reward as any).tokenAmount > 0,
        `token reward ${reward.id} must have positive tokenAmount`,
      )
    }
  })
})

describe('getDateString', () => {
  it('formats date as YYYY-MM-DD', () => {
    const date = new Date('2025-06-15T14:30:00Z')
    assert.equal(getDateString(date), '2025-06-15')
  })

  it('zero-pads month and day', () => {
    const date = new Date('2025-01-05T00:00:00Z')
    assert.equal(getDateString(date), '2025-01-05')
  })
})
