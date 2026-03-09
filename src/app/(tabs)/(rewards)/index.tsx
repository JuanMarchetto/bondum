import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useRewards } from '../../../hooks/useRewards'
import { Badge, FadeIn, EmptyState } from '../../../components/ui'
import { Header } from '../../../components/layout/Header'
import { PanicafeCouponCard } from '../../../components/PanicafeCouponCard'
import { isPanicafeReward } from '../../../utils/panicafeCoupons'
import { useLanguage } from '../../../contexts/LanguageContext'

const panicoinSvg = require('../../../assets/panicoin.svg')

export default function RewardsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { refetch: refetchBalance } = useBondumBalance()
  const { rewards: allRewards, refetch: refetchRewards } = useRewards()
  const [refreshing, setRefreshing] = useState(false)
  const { t } = useLanguage()
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchBalance(), refetchRewards()])
    setRefreshing(false)
  }, [refetchBalance, refetchRewards])
  const [viewMode, setViewMode] = useState<'brands' | 'bondum' | 'panicafe'>('brands')

  const bondumRewards = allRewards.filter((r) => r.brand === 'Bondum')
  const panicafeRewards = allRewards.filter((r) => r.brand === 'PaniCafe')
  const filteredRewards = viewMode === 'panicafe' ? panicafeRewards : bondumRewards

  return (
    <View className="flex-1 bg-violet-50">
      <Header userName={user?.username || 'User'} />

      {/* Content */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />}>
        {viewMode === 'brands' ? (
          // Brands View
          <View className="flex-1">
            <Text className="text-gray-900 font-bold mb-8 text-center" style={{ fontSize: 40 }}>
              {t('rewards.affiliatedBrands')}
            </Text>

            {/* Bondum Row — hidden until rewards are available */}

            {/* PaniCafe Row */}
            <FadeIn delay={0}>
              <Pressable
                onPress={() => setViewMode('panicafe')}
                className="flex-row items-center mb-6 bg-white rounded-2xl p-5"
                style={{ borderWidth: 1, borderColor: '#9b9db5' }}
              >
                <ExpoImage source={panicoinSvg} style={{ width: 48, height: 48 }} contentFit="contain" />
                <Text className="text-gray-900 font-bold text-lg ml-4">{t('rewards.panicafeRewards')}</Text>
              </Pressable>
            </FadeIn>

            {/* Footer */}
            <Text className="text-gray-500 text-center text-sm mt-4">{t('rewards.moreBrands')}</Text>
            <View className="h-8" />
          </View>
        ) : (
          // Rewards View (Bondum or PaniCafe)
          <View>
            <Pressable onPress={() => setViewMode('brands')} className="mb-4">
              <Text className="text-violet-500 font-semibold">{t('rewards.backToBrands')}</Text>
            </Pressable>

            <Text className="text-gray-900 text-xl font-bold mb-4">
              {viewMode === 'panicafe' ? t('rewards.panicafeRewards') : t('rewards.bondumRewards')}
            </Text>

            {filteredRewards.map((reward, index) => (
              <FadeIn key={reward.id} delay={index * 80}>
                <Pressable onPress={() => router.push(`/(tabs)/(rewards)/${reward.id}`)}>
                  <View className="mb-4 bg-gray-100 rounded-3xl p-5" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
                    <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
                      <Text className="text-violet-500 text-lg font-bold">{t('common.reward')}</Text>
                      <Badge variant="outline">{t('common.available', { count: reward.available })}</Badge>
                    </View>

                    <Text className="text-gray-900 font-semibold mb-5">{reward.title}</Text>

                    {isPanicafeReward(reward.brand) ? (
                      <PanicafeCouponCard value={reward.value} cost={reward.cost} size="sm" />
                    ) : (
                      <View
                        className={`rounded-xl py-10 items-center ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-violet-600'}`}
                      >
                        <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </FadeIn>
            ))}

            {filteredRewards.length === 0 && (
              <EmptyState
                icon="🎁"
                title={t('rewards.noRewards')}
                message={t('rewards.noRewardsDesc')}
                actionLabel={t('home.scan')}
                onAction={() => router.push('/scan')}
              />
            )}

            <View className="h-8" />
          </View>
        )}
      </ScrollView>
    </View>
  )
}
