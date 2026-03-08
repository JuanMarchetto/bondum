import { View, Text, ScrollView, Pressable, Image, RefreshControl } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useRewards } from '../../../hooks/useRewards'
import { Badge, Avatar, BellIcon } from '../../../components/ui'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')
const bLogo = require('../../../assets/b-logo.png')
const panicoinSvg = require('../../../assets/panicoin.svg')

export default function RewardsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBondumBalance()
  const { rewards: allRewards, refetch: refetchRewards } = useRewards()
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchBalance(), refetchRewards()])
    setRefreshing(false)
  }, [refetchBalance, refetchRewards])
  const [viewMode, setViewMode] = useState<'brands' | 'bondum' | 'panicafe'>('brands')

  const bondumRewards = allRewards.filter((r) => r.brand === 'Bondum')
  const panicafeRewards = allRewards.filter((r) => r.brand === 'PaniCafe')

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        <View className="items-center mb-4">
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold" style={{ fontSize: 24 }}>Hello, {user?.username || 'User'}!</Text>
            <Text className="text-violet-200" style={{ fontSize: 19 }}>
              {isBalanceLoading ? '...' : bondumBalance.toLocaleString()} $BONDUM
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
            <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}>
        {viewMode === 'brands' ? (
          // Brands View
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-8 text-center" style={{ fontSize: 40 }}>
              Affiliated Brands
            </Text>

            {/* Bondum Row */}
            <Pressable
              onPress={() => setViewMode('bondum')}
              className="flex-row items-center mb-6 bg-white rounded-2xl p-5"
              style={{ borderWidth: 1, borderColor: '#9b9db5' }}
            >
              <Image source={bLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
              <Text className="text-gray-900 font-bold text-lg ml-4">Bondum Rewards</Text>
            </Pressable>

            {/* PaniCafe Row */}
            <Pressable
              onPress={() => setViewMode('panicafe')}
              className="flex-row items-center mb-6 bg-white rounded-2xl p-5"
              style={{ borderWidth: 1, borderColor: '#9b9db5' }}
            >
              <ExpoImage source={panicoinSvg} style={{ width: 48, height: 48 }} contentFit="contain" />
              <Text className="text-gray-900 font-bold text-lg ml-4">Panicafe Rewards</Text>
            </Pressable>

            {/* Footer */}
            <Text className="text-gray-500 text-center text-sm mt-4">More brands joining soon</Text>
            <View className="h-8" />
          </View>
        ) : (
          // Rewards View (Bondum or PaniCafe)
          <View>
            <Pressable onPress={() => setViewMode('brands')} className="mb-4">
              <Text className="text-violet-500 font-semibold">← Back to Brands</Text>
            </Pressable>

            <Text className="text-gray-900 text-xl font-bold mb-4">
              {viewMode === 'panicafe' ? 'PaniCafe Rewards' : 'Bondum Rewards'}
            </Text>

            {(viewMode === 'panicafe' ? panicafeRewards : bondumRewards).map((reward) => (
              <Pressable key={reward.id} onPress={() => router.push(`/(tabs)/(rewards)/${reward.id}`)}>
                <View className="mb-4 bg-gray-100 rounded-3xl p-5" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
                  <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
                    <Text className="text-violet-500 text-lg font-bold">Reward</Text>
                    <Badge variant="outline">{reward.available} available</Badge>
                  </View>

                  <Text className="text-gray-900 font-semibold mb-5">{reward.title}</Text>

                  <View
                    className={`rounded-xl py-10 items-center ${reward.type === 'nft' ? 'bg-violet-500' : viewMode === 'panicafe' ? 'bg-amber-600' : 'bg-red-600'}`}
                  >
                    <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
                  </View>
                </View>
              </Pressable>
            ))}

            <View className="h-8" />
          </View>
        )}
      </ScrollView>
    </View>
  )
}
