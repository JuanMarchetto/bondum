import { View, Text, Pressable, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Badge, Button, Avatar, BellIcon } from '../../../components/ui'

const avatarImage = require('../../../assets/avatar.png')
const bondumLogo = require('../../../assets/bondum_logo.png')

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
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="items-center mb-4">
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold" style={{ fontSize: 24 }}>Hello, {user?.username || 'User'}!</Text>
              <Text className="text-violet-200" style={{ fontSize: 19 }}>{(user?.balance || 0).toLocaleString()} $BONDUM</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable className="p-2">
                <BellIcon size={32} color="white" />
              </Pressable>
              <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
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
              <View className="bg-gray-1000 rounded-2xl px-12 py-8 mb-6">
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
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        <View className="flex-row items-center mb-4 relative">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-white" style={{ fontSize: 64 }}>←</Text>
          </Pressable>
          <View className="absolute left-0 right-0 items-center">
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">Hello, {user?.username || 'User'}!</Text>
            <Text className="text-violet-200">~ {(user?.balance || 0).toLocaleString()} $BONDUM</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
            <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
          </View>
        </View>
      </View>

      {/* Reward Detail */}
      <View className="flex-1 px-2 pt-6 justify-center">
        <View className="bg-white rounded-3xl p-5 self-center" style={{ borderWidth: 1, borderColor: '#9b9db5', flex: 0.9, width: '96%' }}>
          <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
            <Text className="text-4xl font-extrabold">
              <Text className="text-gray-900">{reward.cost.toLocaleString()} </Text>
              <Text style={{ color: '#8b5cf6' }}>$BONDUM</Text>
            </Text>
            <View style={{ borderWidth: 4, borderColor: '#8b5cf6', borderRadius: 12, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text className="text-2xl font-extrabold" style={{ color: '#8b5cf6' }}>{reward.available} available</Text>
            </View>
          </View>

          <Text className="text-gray-900 font-semibold text-3xl" style={{ marginTop: 12, marginBottom: 48 }}>{reward.description}</Text>

          <View
            className={`rounded-xl py-32 items-center mb-6 ${reward.type === 'nft' ? 'bg-gray-1000' : 'bg-red-600'}`}
          >
            <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
          </View>

          <View className="items-center">
            <Button
              variant="primary"
              size="lg"
              className="w-[66%]"
              style={{ paddingVertical: 20, borderRadius: 20 }}
              onPress={handleClaim}
              loading={isClaiming}
              disabled={(user?.balance || 0) < reward.cost}
            >
              <Text className="text-white font-bold text-4xl">Claim reward</Text>
            </Button>
          </View>

          {(user?.balance || 0) < reward.cost && (
            <Text className="text-red-500 text-center mt-3 text-sm">
              Not enough $BONDUM tokens. You need {reward.cost - (user?.balance || 0)} more.
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
