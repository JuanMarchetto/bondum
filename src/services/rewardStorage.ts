import * as SecureStore from 'expo-secure-store'

const CLAIMED_REWARDS_KEY = 'claimed_rewards'

export interface ClaimedReward {
  id: string
  brand: string
  type: string
  value: string
  claimedAt: string
  txSignature?: string
}

export async function getClaimedRewards(): Promise<ClaimedReward[]> {
  try {
    const data = await SecureStore.getItemAsync(CLAIMED_REWARDS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.warn('[rewardStorage] getClaimedRewards failed:', error)
    return []
  }
}

export async function addClaimedReward(reward: ClaimedReward): Promise<void> {
  const rewards = await getClaimedRewards()
  rewards.push(reward)
  await SecureStore.setItemAsync(CLAIMED_REWARDS_KEY, JSON.stringify(rewards))
}
