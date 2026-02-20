// User types
export interface User {
  id: string
  username: string
  avatarUrl?: string | null
  balance: number
  nftCount: number
}

// Reward types
export type RewardType = 'discount' | 'token' | 'nft'

export interface Reward {
  id: string
  type: RewardType
  title: string
  description: string
  value: string | number
  imageUrl?: string
  available: number
  claimed: boolean
}

// NFT types
export interface NFT {
  id: string
  name: string
  imageUrl: string
  rarity: 'common' | 'rare' | 'ultra_rare' | 'legendary'
}

// Token types
export interface Token {
  symbol: string
  name: string
  balance: number
  iconUrl?: string
}

// Transaction types
export interface Transaction {
  id: string
  type: 'swap' | 'send' | 'receive' | 'claim'
  amount: number
  token: string
  timestamp: Date
  status: 'pending' | 'completed' | 'failed'
}

// Auth types
export type AuthProvider = 'solana' | 'privy' | 'guest'

export interface AuthState {
  isAuthenticated: boolean
  provider: AuthProvider | null
  address: string | null
  user: User | null
}
