import { useQuery } from '@tanstack/react-query'
import { fetchRewards, type RewardCatalogItem } from '../services/rewardApi'
import { useLanguage } from '../contexts/LanguageContext'

/**
 * Hook to fetch the reward catalog for a specific brand or all brands.
 * Falls back to bundled catalog when the API is unreachable.
 */
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

/**
 * Hook to fetch a single reward by ID.
 */
export function useReward(id: string) {
  const { rewards, isLoading, error } = useRewards()

  const reward = rewards.find((r: RewardCatalogItem) => r.id === id) || null

  return { reward, isLoading, error }
}
