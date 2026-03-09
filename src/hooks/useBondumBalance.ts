import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { getTokenBalance, BONDUM_MINT } from '../services/solana'

/**
 * Hook to fetch the real $BONDUM token balance for the connected wallet.
 * Works with both native Solana wallet and Privy embedded wallet.
 * Uses react-query for caching, auto-refetching, and loading states.
 */
export function useBondumBalance() {
  // Web demo: return fake balance
  if (Platform.OS === 'web') {
    return { balance: 12500, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  const { address, isAuthenticated } = useAuth()

  const {
    data: balance = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bondumBalance', address],
    queryFn: () => getTokenBalance(address!),
    enabled: isAuthenticated && !!address,
    staleTime: 0, // always treat as stale so every mount triggers a refetch
    gcTime: 5 * 60_000, // keep in cache for 5 min (garbage collection)
    refetchOnMount: 'always', // always refetch when the component mounts
    refetchInterval: 30_000, // auto-refetch every 30 seconds in background
  })

  return {
    balance,
    isLoading,
    error,
    refetch,
  }
}
