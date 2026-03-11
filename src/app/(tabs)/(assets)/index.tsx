import { View, Text, ScrollView, Pressable, Image, RefreshControl } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useWalletNfts } from '../../../hooks/useWalletNfts'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { Card, Skeleton, FadeIn } from '../../../components/ui'
import { Header } from '../../../components/layout/Header'
import { useLanguage } from '../../../contexts/LanguageContext'

const solLogo = require('../../../assets/sol-logo.png')
const bLogo = require('../../../assets/b-logo.png')
const usdcLogo = require('../../../assets/usdc-logo.png')
const panicoinSvg = require('../../../assets/panicoin.svg')

export default function AssetsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBondumBalance()
  const { nfts, nftCount, isLoading: isNftsLoading, refetch: refetchNfts } = useWalletNfts()
  const { tokens, isLoading: isTokensLoading, refetch: refetchTokens } = useTokenBalances()
  const [refreshing, setRefreshing] = useState(false)
  const { t } = useLanguage()
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchBalance(), refetchTokens(), refetchNfts()])
    } finally {
      setRefreshing(false)
    }
  }, [refetchBalance, refetchTokens, refetchNfts])

  return (
    <View className="flex-1 bg-violet-50" testID="assets-screen">
      <Header userName={user?.username || 'User'} />

      {/* Content */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}>
        {/* Title */}
        <Text className="text-center mb-6">
          <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>{t('assets.title')} </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 36 }}>{t('assets.titleSuffix')}</Text>
        </Text>

        {/* NFT Collection Card — bigger version */}
        <FadeIn delay={0}>
        <Card className="mb-6" padding="none" style={{ padding: 24 }} testID="assets-nft-card">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-lg leading-tight mb-1">
                <Text className="text-gray-400">{t('assets.viewCollection')} </Text>
                <Text className="text-violet-500">{t('assets.collection')}</Text>
              </Text>
              {isNftsLoading ? (
                <Skeleton width={120} height={28} borderRadius={8} />
              ) : nftCount === 0 ? (
                <Text className="text-gray-900 text-2xl font-extrabold leading-tight">{t('assets.noNfts')}</Text>
              ) : (
                <Text className="text-gray-900 text-3xl font-extrabold leading-tight">
                  {t('assets.hasNfts', { count: nftCount, plural: nftCount !== 1 ? 's' : '' })}
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
            <View className="flex-row items-center justify-center py-4" style={{ gap: 10 }}>
              <View className="rounded-xl bg-violet-100 items-center justify-center" style={{ width: 72, height: 72 }}>
                <Text style={{ fontSize: 28 }}>{'\uD83D\uDDBC\uFE0F'}</Text>
              </View>
              <View className="rounded-xl bg-violet-50 items-center justify-center" style={{ width: 72, height: 72 }}>
                <Text style={{ fontSize: 28 }}>{'\u2728'}</Text>
              </View>
              <View className="rounded-xl bg-violet-100 items-center justify-center" style={{ width: 72, height: 72 }}>
                <Text style={{ fontSize: 28 }}>{'\uD83C\uDFA8'}</Text>
              </View>
            </View>
          )}
        </Card>
        </FadeIn>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            onPress={() => router.push('/(tabs)/(trade)')}
            className="flex-1 bg-violet-500 rounded-2xl items-center justify-center flex-row gap-2"
            style={{ paddingVertical: 14 }}
            testID="assets-swap-btn"
          >
            <Ionicons name="swap-horizontal" size={20} color="white" />
            <Text className="text-white font-bold text-base">{t('common.swap')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/(home)/send')}
            className="flex-1 bg-gray-100 rounded-2xl items-center justify-center flex-row gap-2"
            style={{ paddingVertical: 14, borderWidth: 1, borderColor: '#E5E5E5' }}
            testID="assets-send-btn"
          >
            <Ionicons name="paper-plane-outline" size={20} color="#8B5CF6" />
            <Text className="text-violet-500 font-bold text-base">{t('common.send')}</Text>
          </Pressable>
        </View>

        {/* Token List */}
        <FadeIn delay={100}>
        <Text className="text-gray-500 text-sm font-semibold mb-3">{t('assets.tokens')}</Text>

        <View className="mb-8" testID="assets-token-list">
          {isTokensLoading ? (
            <View style={{ gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} className="bg-white flex-row items-center" style={{ padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E5E5' }}>
                  <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width={80} height={14} />
                    <Skeleton width={50} height={12} />
                  </View>
                  <Skeleton width={60} height={14} />
                </View>
              ))}
            </View>
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
        </FadeIn>

        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  )
}
