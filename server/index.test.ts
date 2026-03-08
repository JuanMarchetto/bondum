/**
 * Tests for Bondum Reward Server logic
 *
 * Imports pure functions from streak.ts — same code the server uses.
 * No copy-pasting, no external test framework.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  freshStreak,
  getDateString,
  getMultiplier,
  getNextMilestone,
  updateStreakPure,
  getDailyChallenge,
  generateRecommendation,
  updateChallengeProgress,
  rewardCatalog,
} from './streak.js'

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
    assert.equal(result.streak.longestStreak, 2)
  })

  it('longestStreak tracks the highest streak seen', () => {
    const streak = freshStreak()
    updateStreakPure(streak, '2025-06-01')
    updateStreakPure(streak, '2025-06-02')
    updateStreakPure(streak, '2025-06-03')
    updateStreakPure(streak, '2025-06-05') // break

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
      let result
      for (let day = 1; day <= 7; day++) {
        const dateStr = `2025-06-${String(day).padStart(2, '0')}`
        result = updateStreakPure(streak, dateStr)
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
    const validTypes = ['scan', 'explore', 'streak']
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

describe('Challenge progress tracking', () => {
  it('tracks scan progress', () => {
    const streak = freshStreak()
    const result = updateChallengeProgress(streak, 'scan', 1, 2)

    assert.equal(result.progress, 1)
    assert.equal(result.completed, false)
  })

  it('marks challenge as completed when target reached', () => {
    const streak = freshStreak()
    updateChallengeProgress(streak, 'scan', 1, 2)
    const result = updateChallengeProgress(streak, 'scan', 1, 2)

    assert.equal(result.progress, 2)
    assert.equal(result.completed, true)
  })

  it('accumulates progress beyond target', () => {
    const streak = freshStreak()
    updateChallengeProgress(streak, 'scan', 1, 2)
    updateChallengeProgress(streak, 'scan', 1, 2)
    const result = updateChallengeProgress(streak, 'scan', 1, 2)

    assert.equal(result.progress, 3)
    assert.equal(result.completed, true)
  })
})

describe('Smart recommendation engine', () => {
  it('new user (streak=0, balance=0) gets "start a streak" message', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-new',
      streak: 0,
      balance: 0,
    }, rewardCatalog)

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
    }, rewardCatalog)

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
    }, rewardCatalog)

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
    }, rewardCatalog)

    assert.ok(result.suggestedReward !== null, 'should suggest a reward')
    assert.equal(result.urgency, 'high')
    const suggested = rewardCatalog.find((r) => r.id === result.suggestedReward)
    assert.ok(suggested, 'suggested reward must exist in catalog')
    assert.equal(suggested!.brand, 'PaniCafe')
  })

  it('high-balance user (no streak) gets reward suggestion', () => {
    const result = generateRecommendation({
      walletAddress: 'test-wallet-high-balance',
      streak: 0,
      balance: 100000,
    }, rewardCatalog)

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
    }, rewardCatalog)

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

    assert.ok(titles.some((t) => t.includes('Café')), 'should have a Café reward')
    assert.ok(titles.some((t) => t.includes('Medialuna')), 'should have a Medialuna reward')
    assert.ok(titles.some((t) => t.includes('Croissant')), 'should have a Croissant reward')
    assert.ok(titles.some((t) => t.includes('Jugo Natural')), 'should have a Jugo Natural reward')
    assert.ok(titles.some((t) => t.includes('Desayuno')), 'should have a Desayuno reward')
    assert.ok(titles.some((t) => t.includes('Helado')), 'should have a Helado reward')
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
      assert.ok(typeof reward.available === 'number', `reward ${reward.id} available must be a number`)
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
