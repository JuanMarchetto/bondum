import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getTokenBalance, BONDUM_MINT } from '../services/solana'

/**
 * Hook to fetch the real $BONDUM token balance for the connected wallet.
 * Works with both native Solana wallet and Privy embedded wallet.
 * Uses react-query for caching, auto-refetching, and loading states.
 */
export function useBondumBalance() {
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
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // auto-refetch every 60 seconds
  })

  return {
    balance,
    isLoading,
    error,
    refetch,
  }
}

