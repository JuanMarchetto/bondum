import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import {
  getTokenBalance,
  getSolBalance,
  BONDUM_MINT,
  USDC_MINT,
  PANICAFE_MINT,
  SKR_MINT,
} from '../services/solana'

export interface TokenInfo {
  symbol: string
  name: string
  balance: number
  icon: string // emoji fallback
}

async function fetchAllBalances(walletAddress: string): Promise<TokenInfo[]> {
  const [solBalance, bondumBalance, usdcBalance, panicafeBalance, skrBalance] = await Promise.all([
    getSolBalance(walletAddress),
    getTokenBalance(walletAddress, BONDUM_MINT),
    getTokenBalance(walletAddress, USDC_MINT),
    getTokenBalance(walletAddress, PANICAFE_MINT),
    getTokenBalance(walletAddress, SKR_MINT),
  ])

  return [
    { symbol: 'SOL', name: 'Solana', balance: solBalance, icon: '◎' },
    { symbol: 'BONDUM', name: 'Bondum', balance: bondumBalance, icon: '🅱️' },
    { symbol: 'USDC', name: 'USD Coin', balance: usdcBalance, icon: '💲' },
    { symbol: 'PANICAFE', name: 'PaniCafe', balance: panicafeBalance, icon: '☕' },
    { symbol: 'SKR', name: 'Seeker', balance: skrBalance, icon: '📱' },
  ]
}

/**
 * Hook to fetch balances for SOL, BONDUM, USDC, and PANICAFE.
 * All fetched in parallel for speed.
 */
export function useTokenBalances() {
  // Web demo: return fake token balances
  if (Platform.OS === 'web') {
    return {
      tokens: [
        { symbol: 'SOL', name: 'Solana', balance: 2.5, icon: '◎' },
        { symbol: 'BONDUM', name: 'Bondum', balance: 12500, icon: '🅱️' },
        { symbol: 'USDC', name: 'USD Coin', balance: 45.0, icon: '💲' },
        { symbol: 'PANICAFE', name: 'PaniCafe', balance: 3200, icon: '☕' },
        { symbol: 'SKR', name: 'Seeker', balance: 1, icon: '📱' },
      ] as TokenInfo[],
      isLoading: false,
      error: null,
      refetch: async () => ({} as any),
    }
  }

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
