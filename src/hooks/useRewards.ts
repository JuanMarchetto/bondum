import { useQuery } from '@tanstack/react-query'
import { fetchRewards, getOfflineCatalog, type RewardCatalogItem } from '../services/rewardApi'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook to fetch the reward catalog for a specific brand or all brands.
 * Falls back to bundled catalog when the API is unreachable.
 */
export function useRewards(brand?: string) {
  const { provider } = useAuth()
  const isDemo = provider === 'guest'
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
    enabled: !isDemo,
  })

  if (isDemo) {
    return { rewards: getOfflineCatalog(brand, language), isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  return { rewards, isLoading, error, refetch }
}

/**
 * Hook to fetch a single reward by ID.
 */
export function useReward(id: string) {
  const { rewards, isLoading, error } = useRewards()

  const reward = rewards.find((r: RewardCatalogItem) => r.id === id) || null

  return { reward, isLoading, error }
}
