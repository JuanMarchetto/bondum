import { useQuery } from '@tanstack/react-query'
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

const DEMO_TOKENS: TokenInfo[] = [
  { symbol: 'SOL', name: 'Solana', balance: 2.5, icon: '◎' },
  { symbol: 'BONDUM', name: 'Bondum', balance: 12500, icon: '🅱️' },
  { symbol: 'USDC', name: 'USD Coin', balance: 45.0, icon: '💲' },
  { symbol: 'PANICAFE', name: 'PaniCafe', balance: 3200, icon: '☕' },
  { symbol: 'SKR', name: 'Seeker', balance: 1, icon: '📱' },
]

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
  const { address, isAuthenticated, provider } = useAuth()
  const isDemo = provider === 'guest'

  const {
    data: tokens = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tokenBalances', address],
    queryFn: () => fetchAllBalances(address!),
    enabled: isAuthenticated && !!address && !isDemo,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })

  if (isDemo) {
    return { tokens: DEMO_TOKENS, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  return { tokens, isLoading, error, refetch }
}
