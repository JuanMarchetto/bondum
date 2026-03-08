import * as SecureStore from 'expo-secure-store'

const STREAK_KEY = 'scan_streak'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastScanDate: string | null
  totalScans: number
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastScanDate: null,
  totalScans: 0,
}

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function getStreakData(): Promise<StreakData> {
  try {
    const data = await SecureStore.getItemAsync(STREAK_KEY)
    return data ? JSON.parse(data) : DEFAULT_STREAK
  } catch {
    return DEFAULT_STREAK
  }
}

/**
 * Records a scan and updates the streak.
 * - Same day: just increments totalScans
 * - Next day: extends the streak
 * - Skipped a day: resets streak to 1
 */
export async function recordScan(): Promise<StreakData> {
  const streak = await getStreakData()
  const today = getDateString(new Date())

  streak.totalScans++

  if (streak.lastScanDate === today) {
    // Already scanned today — just save the totalScans bump
    await SecureStore.setItemAsync(STREAK_KEY, JSON.stringify(streak))
    return streak
  }

  if (streak.lastScanDate) {
    const lastDate = new Date(streak.lastScanDate)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Consecutive day — extend streak
      streak.currentStreak++
    } else {
      // Skipped day(s) — reset
      streak.currentStreak = 1
    }
  } else {
    // First ever scan
    streak.currentStreak = 1
  }

  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak
  }

  streak.lastScanDate = today
  await SecureStore.setItemAsync(STREAK_KEY, JSON.stringify(streak))
  return streak
}
