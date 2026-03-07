import { View, Text, ScrollView, Pressable, Image, RefreshControl } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useWalletNfts } from '../../../hooks/useWalletNfts'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { Avatar, BellIcon, Card } from '../../../components/ui'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')
const solLogo = require('../../../assets/sol-logo.png')
const bLogo = require('../../../assets/b-logo.png')
const usdcLogo = require('../../../assets/usdc-logo.png')
const panicoinSvg = require('../../../assets/panicoin.svg')

export default function AssetsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBondumBalance()
  const { nfts, nftCount, isLoading: isNftsLoading, refetch: refetchNfts } = useWalletNfts()
  const { tokens, isLoading: isTokensLoading, refetch: refetchTokens } = useTokenBalances()
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchBalance(), refetchTokens(), refetchNfts()])
    setRefreshing(false)
  }, [refetchBalance, refetchTokens, refetchNfts])

  return (
    <View className="flex-1 bg-violet-50">
      {/* Small Header — same style as Swap page */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="items-center mb-4">
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>

        {/* User Info */}
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
        {/* Title */}
        <Text className="text-center mb-6">
          <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>YOUR </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 36 }}>ASSETS</Text>
        </Text>

        {/* NFT Collection Card — bigger version */}
        <Card className="mb-6" padding="none" style={{ padding: 24 }}>
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-lg leading-tight mb-1">
                <Text className="text-gray-400">View </Text>
                <Text className="text-violet-500">collection</Text>
              </Text>
              {isNftsLoading ? (
                <Text className="text-gray-900 text-3xl font-extrabold leading-tight">Loading...</Text>
              ) : nftCount === 0 ? (
                <Text className="text-gray-900 text-2xl font-extrabold leading-tight">You don't have NFTs yet</Text>
              ) : (
                <Text className="text-gray-900 text-3xl font-extrabold leading-tight">
                  You have {nftCount} NFT{nftCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>

          {/* NFT preview grid — bigger thumbnails */}
          {nftCount > 0 && (
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {nfts.slice(0, 6).map((nft) => (
                <View
                  key={nft.id}
                  className="rounded-xl overflow-hidden bg-violet-100"
                  style={{ width: 72, height: 72 }}
                >
                  {nft.imageUrl ? (
                    <ExpoImage
                      source={{ uri: nft.imageUrl }}
                      style={{ width: 72, height: 72 }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-violet-200">
                      <Text className="text-violet-500 text-xs font-bold">NFT</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {nftCount === 0 && !isNftsLoading && (
            <View className="flex-row" style={{ gap: 10 }}>
              <View className="rounded-xl bg-violet-100" style={{ width: 72, height: 72 }} />
              <View className="rounded-xl bg-pink-100" style={{ width: 72, height: 72 }} />
              <View className="rounded-xl bg-orange-100" style={{ width: 72, height: 72 }} />
            </View>
          )}
        </Card>

        {/* Token List */}
        <Text className="text-gray-500 text-sm font-semibold mb-3">TOKENS</Text>

        <View className="mb-8">
          {isTokensLoading ? (
            <Card padding="none" style={{ padding: 20 }}>
              <Text className="text-gray-400 text-center text-lg">Loading balances...</Text>
            </Card>
          ) : (
            tokens.map((token, index) => (
              <Pressable
                key={token.symbol}
                onPress={() => router.push('/(tabs)/(trade)')}
                className="bg-white flex-row items-center"
                style={{
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E5E5E5',
                  borderTopLeftRadius: index === 0 ? 16 : 0,
                  borderTopRightRadius: index === 0 ? 16 : 0,
                  borderBottomLeftRadius: index === tokens.length - 1 ? 16 : 0,
                  borderBottomRightRadius: index === tokens.length - 1 ? 16 : 0,
                  marginTop: index > 0 ? -1 : 0,
                }}
              >
                {/* Token icon */}
                {token.symbol === 'SOL' ? (
                  <View className="w-11 h-11 rounded-full overflow-hidden mr-3">
                    <Image source={solLogo} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </View>
                ) : token.symbol === 'BONDUM' ? (
                  <View className="w-11 h-11 rounded-full overflow-hidden mr-3">
                    <Image source={bLogo} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </View>
                ) : token.symbol === 'USDC' ? (
                  <View className="w-11 h-11 rounded-full overflow-hidden mr-3">
                    <Image source={usdcLogo} style={{ width: 44, height: 44 }} resizeMode="contain" />
                  </View>
                ) : token.symbol === 'PANICAFE' ? (
                  <View className="w-11 h-11 rounded-full overflow-hidden mr-3">
                    <ExpoImage source={panicoinSvg} style={{ width: 44, height: 44 }} contentFit="contain" />
                  </View>
                ) : (
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: '#E5E5E5',
                    }}
                  >
                    <Text className="text-white text-lg">{token.icon}</Text>
                  </View>
                )}

                {/* Token info */}
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-base">{token.name}</Text>
                  <Text className="text-gray-400 text-sm">{token.symbol}</Text>
                </View>

                {/* Balance */}
                <Text className="text-gray-900 font-bold text-base">
                  {token.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: token.symbol === 'SOL' ? 4 : 2,
                  })}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  )
}
