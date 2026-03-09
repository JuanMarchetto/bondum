import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getWalletNfts } from '../services/solana'

const DEMO_NFTS = [
  { id: 'nft-1', name: 'Bondum OG #42', imageUrl: 'https://placehold.co/200x200/8B5CF6/white?text=OG+%2342' },
  { id: 'nft-2', name: 'PaniCafe VIP #7', imageUrl: 'https://placehold.co/200x200/d97706/white?text=VIP+%237' },
  { id: 'nft-3', name: 'Solana Seeker #128', imageUrl: 'https://placehold.co/200x200/14b8a6/white?text=Seeker+%23128' },
]

/**
 * Hook to fetch NFTs owned by the connected wallet.
 * Uses the DAS API via the configured Solana RPC.
 */
export function useWalletNfts() {
  const { address, isAuthenticated, provider } = useAuth()
  const isDemo = provider === 'guest'

  const {
    data: nfts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['walletNfts', address],
    queryFn: () => getWalletNfts(address!),
    enabled: isAuthenticated && !!address && !isDemo,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  if (isDemo) {
    return { nfts: DEMO_NFTS, nftCount: 3, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  return { nfts, nftCount: nfts.length, isLoading, error, refetch }
}
