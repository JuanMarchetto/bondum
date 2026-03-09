import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { getWalletNfts } from '../services/solana'

/**
 * Hook to fetch NFTs owned by the connected wallet.
 * Uses the DAS API via the configured Solana RPC.
 */
export function useWalletNfts() {
  // Web demo: return fake NFTs
  if (Platform.OS === 'web') {
    const fakeNfts = [
      { id: 'nft-1', name: 'Bondum OG #42', imageUrl: 'https://placehold.co/200x200/8B5CF6/white?text=OG+%2342' },
      { id: 'nft-2', name: 'PaniCafe VIP #7', imageUrl: 'https://placehold.co/200x200/d97706/white?text=VIP+%237' },
      { id: 'nft-3', name: 'Solana Seeker #128', imageUrl: 'https://placehold.co/200x200/14b8a6/white?text=Seeker+%23128' },
    ]
    return { nfts: fakeNfts, nftCount: 3, isLoading: false, error: null, refetch: async () => ({} as any) }
  }

  const { address, isAuthenticated } = useAuth()

  const {
    data: nfts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['walletNfts', address],
    queryFn: () => getWalletNfts(address!),
    enabled: isAuthenticated && !!address,
    staleTime: 60_000, // 1 minute
    refetchInterval: 120_000, // auto-refetch every 2 minutes
  })

  return {
    nfts,
    nftCount: nfts.length,
    isLoading,
    error,
    refetch,
  }
}
