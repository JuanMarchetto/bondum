import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStreakData, recordScan, type StreakData } from '../services/streakStorage'
import { fetchStreak } from '../services/rewardApi'
import { useAuth } from '../contexts/AuthContext'

export function useStreak() {
  const { isAuthenticated, address, provider } = useAuth()
  const queryClient = useQueryClient()
  const isDemo = provider === 'guest'

  if (isDemo) {
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

  // Server-side streak (authoritative when available)
  const { data: serverStreak } = useQuery({
    queryKey: ['serverStreak', address],
    queryFn: () => fetchStreak(address!),
    enabled: isAuthenticated && !!address,
    staleTime: 60_000,
  })

  // Local streak as offline fallback
  const { data: localStreak } = useQuery({
    queryKey: ['streak'],
    queryFn: getStreakData,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const logScan = async (): Promise<StreakData> => {
    const updated = await recordScan()
    queryClient.setQueryData(['streak'], updated)
    // Invalidate server streak so it refreshes after /claim
    queryClient.invalidateQueries({ queryKey: ['serverStreak'] })
    return updated
  }

  // Prefer server data, fall back to local
  const streak = serverStreak || localStreak
  const multiplier = serverStreak?.multiplier ?? 1.0 + Math.min((streak?.currentStreak ?? 0) * 0.1, 1.0)
  const nextMilestone = serverStreak?.nextMilestone ?? null

  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    totalScans: streak?.totalScans ?? 0,
    lastScanDate: (localStreak as StreakData)?.lastScanDate ?? null,
    multiplier,
    nextMilestone,
    logScan,
  }
}
