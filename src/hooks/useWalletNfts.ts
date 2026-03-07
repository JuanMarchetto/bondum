import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getWalletNfts } from '../services/solana'

/**
 * Hook to fetch NFTs owned by the connected wallet.
 * Uses the DAS API via the configured Solana RPC.
 */
export function useWalletNfts() {
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



