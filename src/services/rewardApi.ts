/**
 * Reward distribution API client.
 * Communicates with the Bondum reward server to claim and redeem rewards on-chain.
 */

const REWARD_API_URL = process.env.EXPO_PUBLIC_REWARD_API_URL || 'https://api.bondum.xyz'

export interface RewardCatalogItem {
  id: string
  brand: string
  type: 'discount' | 'token' | 'nft'
  title: string
  description: string
  value: string
  cost: number
  available: number
  mint?: string
  tokenAmount?: number
}

export interface ClaimResult {
  success: boolean
  txSignature: string
  tokenAmount: number
  mint: string
  message: string
}

export interface RedeemResult {
  success: boolean
  txSignature: string | null
  rewardId: string
  message: string
}

/**
 * Fetches available rewards for a given brand (or all brands).
 */
export async function fetchRewards(brand?: string): Promise<RewardCatalogItem[]> {
  try {
    const params = brand ? `?brand=${encodeURIComponent(brand)}` : ''
    const response = await fetch(`${REWARD_API_URL}/rewards${params}`)
    if (!response.ok) throw new Error('Failed to fetch rewards')
    const data = await response.json()
    return data.rewards
  } catch {
    // Fallback to bundled catalog when API is unreachable
    return getOfflineCatalog(brand)
  }
}

/**
 * Claims a scan reward on-chain.
 * The server validates the QR data, checks the nonce for replay,
 * and sends SPL tokens from the treasury to the user's wallet.
 */
export async function claimScanReward(params: {
  walletAddress: string
  brand: string
  type: string
  value: string
  tokenAmount: number
  nonce?: string
  signature?: string
}): Promise<ClaimResult> {
  const response = await fetch(`${REWARD_API_URL}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Claim failed' }))
    throw new Error(error.message || 'Failed to claim reward')
  }

  return response.json()
}

/**
 * Redeems a reward from the marketplace by burning $BONDUM tokens.
 * The server verifies the user's balance, executes the burn/transfer,
 * and marks the reward as claimed.
 */
export async function redeemReward(params: {
  walletAddress: string
  rewardId: string
  brand: string
}): Promise<RedeemResult> {
  const response = await fetch(`${REWARD_API_URL}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Redemption failed' }))
    throw new Error(error.message || 'Failed to redeem reward')
  }

  return response.json()
}

/**
 * Registers a referral code for the user.
 */
export async function registerReferral(params: {
  walletAddress: string
  referralCode: string
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${REWARD_API_URL}/referral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Referral failed' }))
    throw new Error(error.message || 'Failed to register referral')
  }

  return response.json()
}

/**
 * Gets referral stats for a user.
 */
export async function getReferralStats(walletAddress: string): Promise<{
  referralCode: string
  referralCount: number
  totalEarned: number
}> {
  try {
    const response = await fetch(`${REWARD_API_URL}/referral/${walletAddress}`)
    if (!response.ok) throw new Error()
    return response.json()
  } catch {
    return {
      referralCode: walletAddress.slice(0, 8),
      referralCount: 0,
      totalEarned: 0,
    }
  }
}

// ─── Offline Fallback Catalog ────────────────────────────────────────────────

function getOfflineCatalog(brand?: string): RewardCatalogItem[] {
  const bondumRewards: RewardCatalogItem[] = [
    {
      id: '1',
      brand: 'Bondum',
      type: 'discount',
      title: '40% discount on your next purchase',
      description: '40% discount on your next purchase of any product',
      value: '40% OFF',
      cost: 5000,
      available: 3,
    },
    {
      id: '2',
      brand: 'Bondum',
      type: 'discount',
      title: '15% discount on your next purchase of the product',
      description: '15% discount on your next purchase of the product',
      value: '15% OFF',
      cost: 10000,
      available: 3,
    },
    {
      id: '3',
      brand: 'Bondum',
      type: 'token',
      title: 'Bonus $BONDUM tokens',
      description: 'Receive 500 bonus $BONDUM tokens',
      value: '500 $BONDUM',
      cost: 2000,
      available: 10,
      tokenAmount: 500,
    },
    {
      id: '4',
      brand: 'Bondum',
      type: 'nft',
      title: 'Exclusive Bondum NFT',
      description: 'An exclusive ultra rare Bondum NFT for your collection',
      value: 'ULTRA RARE NFT',
      cost: 15000,
      available: 1,
    },
  ]

  const panicafeRewards: RewardCatalogItem[] = [
    {
      id: 'pc-1',
      brand: 'PaniCafe',
      type: 'discount',
      title: 'Free Coffee with any pastry purchase',
      description: 'Get a free coffee when you buy any pastry',
      value: 'FREE COFFEE',
      cost: 1000,
      available: 5,
    },
    {
      id: 'pc-2',
      brand: 'PaniCafe',
      type: 'discount',
      title: '25% off any drink',
      description: '25% discount on any drink at PaniCafe',
      value: '25% OFF',
      cost: 2000,
      available: 3,
    },
    {
      id: 'pc-3',
      brand: 'PaniCafe',
      type: 'token',
      title: 'Bonus PaniCafe tokens',
      description: 'Receive 200 bonus PANICAFE tokens',
      value: '200 PANICAFE',
      cost: 500,
      available: 10,
      tokenAmount: 200,
    },
    {
      id: 'pc-4',
      brand: 'PaniCafe',
      type: 'discount',
      title: '50% off pastry of the day',
      description: '50% discount on the pastry of the day',
      value: '50% OFF',
      cost: 3000,
      available: 2,
    },
  ]

  const all = [...bondumRewards, ...panicafeRewards]
  if (!brand) return all
  return all.filter((r) => r.brand.toLowerCase() === brand.toLowerCase())
}
