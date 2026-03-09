import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getTokenBalance } from '../services/solana'

/**
 * Hook to fetch the real $BONDUM token balance for the connected wallet.
 * Works with both native Solana wallet and Privy embedded wallet.
 * Uses react-query for caching, auto-refetching, and loading states.
 */
export function useBondumBalance() {
  const { address, isAuthenticated, provider } = useAuth()
  const isDemo = provider === 'guest'

  const {
    data: balance = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bondumBalance', address],
    queryFn: () => getTokenBalance(address!),
    enabled: isAuthenticated && !!address && !isDemo,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  if (isDemo) {
    return { balance: 12500, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  return { balance, isLoading, error, refetch }
}
