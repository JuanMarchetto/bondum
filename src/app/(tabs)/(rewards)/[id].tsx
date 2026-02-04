import { View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Badge, Button, Avatar } from '../../../components/ui'

// Mock reward data - in real app, fetch from API
const getReward = (id: string) => {
  const rewards: Record<
    string,
    {
      id: string
      type: 'discount' | 'token' | 'nft'
      title: string
      value: string
      description: string
      cost: number
      available: number
    }
  > = {
    '1': {
      id: '1',
      type: 'discount',
      title: '40% discount on your next purchase',
      value: '40% OFF',
      description: '40% discount on your next purchase of any product',
      cost: 5000,
      available: 3,
    },
    '2': {
      id: '2',
      type: 'discount',
      title: '15% discount on your next purchase of the product',
      value: '15% OFF',
      description: '15% discount on your next purchase of the product',
      cost: 10000,
      available: 3,
    },
    '3': {
      id: '3',
      type: 'token',
      title: 'Bonus $BONDUM tokens',
      value: '500 $BONDUM',
      description: 'Receive 500 bonus $BONDUM tokens',
      cost: 2000,
      available: 10,
    },
    '4': {
      id: '4',
      type: 'nft',
      title: 'Exclusive Bondum NFT',
      value: 'ULTRA RARE NFT',
      description: 'An exclusive ultra rare Bondum NFT for your collection',
      cost: 15000,
      available: 1,
    },
  }
  return rewards[id] || rewards['1']
}

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  const reward = getReward(id || '1')

  const handleClaim = async () => {
    setIsClaiming(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsClaiming(false)
    setClaimed(true)
  }

  if (claimed) {
    return (
      <View className="flex-1 bg-violet-50">
        {/* Header */}
        <View className="bg-violet-500 px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16 }}>
          <View className="items-center mb-4">
            <Text className="text-white text-2xl font-extrabold tracking-wide">
              B<Text className="text-violet-200">O</Text>NDUM
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-bold">Hello, {user?.username || 'User'}!</Text>
              <Text className="text-violet-200">~ {(user?.balance || 0).toLocaleString()} $BONDUM</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable className="p-2">
                <Text className="text-white text-xl">🔔</Text>
              </Pressable>
              <Avatar source={user?.avatarUrl} size="lg" />
            </View>
          </View>
        </View>

        {/* Celebration View */}
        <View className="flex-1 items-center justify-center px-6">
          <Card className="w-full items-center py-8" padding="lg">
            <Text className="text-gray-500 text-lg mb-2">You&apos;ve Won</Text>
            <Text className="text-center mb-6">
              <Text className="text-gray-900 text-2xl font-bold">A </Text>
              <Text className="text-violet-500 text-2xl font-extrabold">
                {reward.type === 'nft' ? 'ULTRA RARE ' : ''}
              </Text>
              <Text className="text-gray-900 text-2xl font-bold">{reward.type === 'nft' ? 'NFT' : 'REWARD'}</Text>
            </Text>

            {reward.type === 'token' ? (
              <View className="bg-violet-500 rounded-2xl px-12 py-8 mb-6">
                <Text className="text-white text-3xl font-extrabold">{reward.value}</Text>
              </View>
            ) : reward.type === 'nft' ? (
              <View className="bg-violet-100 rounded-2xl p-6 mb-6 border-4 border-violet-500">
                <View className="w-48 h-48 bg-violet-400 rounded-xl items-center justify-center">
                  <Text className="text-white text-4xl font-extrabold">🎁</Text>
                  <Text className="text-white font-bold mt-2">BONDUM</Text>
                </View>
              </View>
            ) : (
              <View className="bg-red-600 rounded-2xl px-12 py-8 mb-6">
                <Text className="text-white text-3xl font-extrabold">{reward.value}</Text>
              </View>
            )}

            <Button variant="primary" size="lg" onPress={() => router.back()}>
              <Text className="text-white font-bold text-lg">Claim reward</Text>
            </Button>
          </Card>

          {/* Confetti effect placeholder */}
          <View className="absolute inset-0 pointer-events-none">{/* In a real app, use a confetti library */}</View>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="bg-violet-500 px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-white text-2xl">←</Text>
          </Pressable>
          <Text className="text-white text-2xl font-extrabold tracking-wide flex-1 text-center mr-8">
            B<Text className="text-violet-200">O</Text>NDUM
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">Hello, {user?.username || 'User'}!</Text>
            <Text className="text-violet-200">~ {(user?.balance || 0).toLocaleString()} $BONDUM</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <Text className="text-white text-xl">🔔</Text>
            </Pressable>
            <Avatar source={user?.avatarUrl} size="lg" />
          </View>
        </View>
      </View>

      {/* Reward Detail */}
      <View className="flex-1 px-4 pt-6">
        <Card padding="lg">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-gray-900 font-bold text-lg">
              {reward.cost.toLocaleString()} <Text className="text-violet-500">$BONDUM</Text>
            </Text>
            <Badge variant="outline">{reward.available} available</Badge>
          </View>

          <Text className="text-gray-700 mb-4">{reward.description}</Text>

          <View
            className={`rounded-2xl py-12 items-center mb-6 ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-red-600'}`}
          >
            <Text className="text-white text-4xl font-extrabold">{reward.value}</Text>
          </View>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleClaim}
            loading={isClaiming}
            disabled={(user?.balance || 0) < reward.cost}
          >
            Claim reward
          </Button>

          {(user?.balance || 0) < reward.cost && (
            <Text className="text-red-500 text-center mt-3 text-sm">
              Not enough $BONDUM tokens. You need {reward.cost - (user?.balance || 0)} more.
            </Text>
          )}
        </Card>
      </View>
    </View>
  )
}
