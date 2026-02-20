import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import {
  getTokenBalance,
  getSolBalance,
  BONDUM_MINT,
  USDC_MINT,
  PANICAFE_MINT,
} from '../services/solana'

export interface TokenInfo {
  symbol: string
  name: string
  balance: number
  icon: string // emoji fallback
}

async function fetchAllBalances(walletAddress: string): Promise<TokenInfo[]> {
  const [solBalance, bondumBalance, usdcBalance, panicafeBalance] = await Promise.all([
    getSolBalance(walletAddress),
    getTokenBalance(walletAddress, BONDUM_MINT),
    getTokenBalance(walletAddress, USDC_MINT),
    getTokenBalance(walletAddress, PANICAFE_MINT),
  ])

  return [
    { symbol: 'SOL', name: 'Solana', balance: solBalance, icon: '◎' },
    { symbol: 'BONDUM', name: 'Bondum', balance: bondumBalance, icon: '🅱️' },
    { symbol: 'USDC', name: 'USD Coin', balance: usdcBalance, icon: '💲' },
    { symbol: 'PANICAFE', name: 'PaniCafe', balance: panicafeBalance, icon: '☕' },
  ]
}

/**
 * Hook to fetch balances for SOL, BONDUM, USDC, and PANICAFE.
 * All fetched in parallel for speed.
 */
export function useTokenBalances() {
  const { address, isAuthenticated } = useAuth()

  const {
    data: tokens = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: () => fetchAllBalances(address!),
    enabled: isAuthenticated && !!address,
    staleTime: 0, // always treat as stale so every mount triggers a refetch
    gcTime: 5 * 60_000, // keep in cache for 5 min (garbage collection)
    refetchOnMount: 'always', // always refetch when the component mounts
    refetchInterval: 30_000, // auto-refetch every 30 seconds in background
  })

  return {
    tokens,
    isLoading,
    error,
    refetch,
  }
}

