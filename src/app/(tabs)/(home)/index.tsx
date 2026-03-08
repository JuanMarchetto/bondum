import { View, Text, ScrollView, Pressable, useWindowDimensions, Image, RefreshControl } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useWalletNfts } from '../../../hooks/useWalletNfts'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { useRewards } from '../../../hooks/useRewards'
import { useStreak } from '../../../hooks/useStreak'
import { fetchDailyChallenge, fetchAiRecommendation } from '../../../services/rewardApi'
import { Card, Badge, Avatar, IconButton, BellIcon } from '../../../components/ui'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')
const bLogo = require('../../../assets/b-logo.png')
const usdcLogo = require('../../../assets/usdc-logo.png')
const scanIcon = require('../../../assets/scan.png')
const sendIcon = require('../../../assets/send.png')
const boxesIcon = require('../../../assets/boxes.png')
const settingsIcon = require('../../../assets/settings.png')

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, address } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBondumBalance()
  const { nfts, nftCount, isLoading: isNftsLoading, refetch: refetchNfts } = useWalletNfts()
  const { tokens, isLoading: isTokensLoading, refetch: refetchTokens } = useTokenBalances()
  const { rewards, refetch: refetchRewards } = useRewards('Bondum')
  const { currentStreak, totalScans, multiplier, nextMilestone } = useStreak()
  const { width } = useWindowDimensions()

  // Daily challenge
  const { data: dailyChallenge } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: fetchDailyChallenge,
    staleTime: 5 * 60_000,
  })

  // AI recommendation
  const { data: aiRecommendation } = useQuery({
    queryKey: ['aiRecommendation', address, currentStreak, bondumBalance],
    queryFn: () => fetchAiRecommendation({
      walletAddress: address!,
      streak: currentStreak,
      balance: bondumBalance,
    }),
    enabled: !!address,
    staleTime: 2 * 60_000,
  })
  const avatarSize = Math.round(width * 0.24)
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchBalance(), refetchTokens(), refetchNfts(), refetchRewards()])
    setRefreshing(false)
  }, [refetchBalance, refetchTokens, refetchNfts, refetchRewards])

  const quickActions = [
    { icon: scanIcon, label: 'Scan', onPress: () => router.push('/scan') },
    { icon: sendIcon, label: 'Send', onPress: () => router.push('/(tabs)/(home)/send') },
    { icon: boxesIcon, label: 'Boxes', onPress: () => router.push('/(tabs)/(rewards)') },
    { icon: settingsIcon, label: 'Settings', onPress: () => router.push('/(tabs)/(home)/settings') },
  ]

  // Featured rewards from API (show first 2)
  const featuredRewards = rewards.slice(0, 2)

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pb-10 rounded-b-3xl min-h-[50vh]" style={{ paddingTop: insets.top + 32, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 36 }}>
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
          </View>
        </View>

        {/* User Info + Avatar */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-white text-6xl font-extrabold">{user?.username || 'User'}</Text>
          </View>
          <Avatar source={avatarImage} size="custom" customSize={avatarSize} style={{ borderWidth: 6, borderColor: 'white' }} />
        </View>

        {/* Balance */}
        <View className="flex-row items-center gap-3 mb-2">
          <Image source={bLogo} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
          <Text className="text-white font-extrabold" style={{ fontSize: 27 }}>
            {isBalanceLoading ? '...' : bondumBalance.toLocaleString()} $BONDUM
          </Text>
        </View>
        
        <View className="flex-row items-center gap-3">
          <Image source={usdcLogo} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
          <Text className="text-white font-extrabold" style={{ fontSize: 27 }}>
            {isTokensLoading ? '...' : (tokens.find(t => t.symbol === 'USDC')?.balance || 0).toLocaleString()} USDC
          </Text>
        </View>

        {/* NFT Collection Card */}
        <Pressable className="mt-9 mx-2">
          <Card className="flex-row items-center justify-between" padding="none" style={{ padding: 24 }}>
            <View className="flex-1">
              <Text className="text-lg leading-tight">
                <Text className="text-gray-400">View </Text>
                <Text className="text-violet-500">collection</Text>
              </Text>
              {isNftsLoading ? (
                <Text className="text-gray-900 text-4xl font-extrabold leading-tight">Loading...</Text>
              ) : nftCount === 0 ? (
                <Text className="text-gray-900 text-2xl font-extrabold leading-tight">You don't have NFTs yet</Text>
              ) : (
                <Text className="text-gray-900 text-4xl font-extrabold leading-tight">
                  You have {nftCount} NFT{nftCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            {nftCount > 0 && (
              <View className="flex-row">
                {nfts.slice(0, 3).map((nft, index) => (
                  <View
                    key={nft.id}
                    className="w-12 h-12 rounded-lg overflow-hidden bg-violet-100"
                    style={{ marginRight: index < Math.min(nfts.length, 3) - 1 ? -8 : 0 }}
                  >
                    {nft.imageUrl ? (
                      <ExpoImage
                        source={{ uri: nft.imageUrl }}
                        style={{ width: 48, height: 48 }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View className="w-12 h-12 bg-violet-200 items-center justify-center">
                        <Text className="text-violet-500 text-xs">NFT</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-2 pt-4" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}>
        {/* Quick Actions */}
        <View className="flex-row justify-around mb-4">
          {quickActions.map((action) => (
            <IconButton
              key={action.label}
              icon={<Image source={action.icon} style={{ width: 24, height: 24 }} resizeMode="contain" />}
              label={action.label}
              onPress={action.onPress}
            />
          ))}
        </View>

        {/* Streak Banner with Multiplier */}
        <View className="mx-2 mb-4 bg-violet-50 rounded-2xl" style={{ padding: 16, borderWidth: 1, borderColor: '#ddd6fe' }}>
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <View className="bg-violet-500 rounded-xl items-center justify-center" style={{ width: 44, height: 44 }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
              </View>
              <View>
                <Text className="text-gray-900 font-bold" style={{ fontSize: 16 }}>
                  {currentStreak > 0 ? `${currentStreak}-day streak` : 'Start a streak!'}
                </Text>
                <Text className="text-gray-500 text-xs">{totalScans} total scans</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-violet-600 rounded-lg px-2 py-1">
                <Text className="text-white font-bold text-xs">{multiplier.toFixed(1)}x</Text>
              </View>
              <Pressable onPress={() => router.push('/scan')} className="bg-violet-500 rounded-xl px-4 py-2">
                <Text className="text-white font-bold text-sm">Scan</Text>
              </Pressable>
            </View>
          </View>
          {nextMilestone && (
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-500 text-xs">
                  Day {currentStreak} of {nextMilestone.days} streak
                </Text>
                <Text className="text-violet-500 text-xs font-bold">+{nextMilestone.bonus} bonus</Text>
              </View>
              <View className="bg-violet-200 rounded-full h-2 overflow-hidden">
                <View
                  className="bg-violet-500 h-2 rounded-full"
                  style={{ width: `${Math.min((currentStreak / nextMilestone.days) * 100, 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Smart Insight Card */}
        {aiRecommendation && (
          <Pressable
            className="mx-2 mb-4 rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#7c3aed', padding: 16 }}
            onPress={() => aiRecommendation.suggestedReward ? router.push(`/(tabs)/(rewards)/${aiRecommendation.suggestedReward}`) : router.push('/scan')}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Text style={{ fontSize: 16 }}>✨</Text>
              <Text className="text-violet-200 font-bold text-xs uppercase">Smart Insight</Text>
            </View>
            <Text className="text-white font-medium" style={{ fontSize: 14, lineHeight: 20 }}>
              {aiRecommendation.recommendation}
            </Text>
          </Pressable>
        )}

        {/* Daily Challenge */}
        {dailyChallenge && (
          <View className="mx-2 mb-4 bg-amber-50 rounded-2xl flex-row items-center justify-between" style={{ padding: 16, borderWidth: 1, borderColor: '#fde68a' }}>
            <View className="flex-row items-center gap-3 flex-1">
              <View className="bg-amber-400 rounded-xl items-center justify-center" style={{ width: 40, height: 40 }}>
                <Text style={{ fontSize: 18 }}>🎯</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-bold text-sm">Daily Challenge</Text>
                <Text className="text-gray-600 text-xs">{dailyChallenge.description}</Text>
              </View>
            </View>
            <View className="bg-amber-400 rounded-lg px-2 py-1">
              <Text className="text-amber-900 font-bold text-xs">+{dailyChallenge.reward}</Text>
            </View>
          </View>
        )}

        {/* Rewards Section */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2 px-2">
            {featuredRewards.map((reward) => (
              <View key={reward.id} className="mr-3 w-[75%] bg-gray-100 rounded-3xl" style={{ borderWidth: 1, borderColor: '#9b9db5', padding: 18.52 }}>
                <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
                  <Text className="text-violet-500 text-lg font-bold">Reward</Text>
                  <Badge variant="outline">{reward.available} available</Badge>
                </View>
                <Text className="text-gray-900 font-semibold mb-3">{reward.title}</Text>
                <View className="bg-red-600 rounded-xl items-center" style={{ paddingVertical: 37.04 }}>
                  <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-2" />
      </ScrollView>
    </View>
  )
}
