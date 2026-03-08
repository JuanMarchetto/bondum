import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStreakData, recordScan, type StreakData } from '../services/streakStorage'
import { useAuth } from '../contexts/AuthContext'

export function useStreak() {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn: getStreakData,
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const logScan = async (): Promise<StreakData> => {
    const updated = await recordScan()
    queryClient.setQueryData(['streak'], updated)
    return updated
  }

  return {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    totalScans: streak?.totalScans ?? 0,
    lastScanDate: streak?.lastScanDate ?? null,
    logScan,
  }
}
