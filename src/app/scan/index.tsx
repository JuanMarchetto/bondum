import { View, Text, Pressable, StyleSheet, Image, Alert, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useBondumBalance } from '../../hooks/useBondumBalance'
import { Button, ChevronBack, FadeIn, ScalePulse } from '../../components/ui'
import { TransactionConfirmation } from '../../components/TransactionConfirmation'
import { parseQrCode, type ParsedQrReward } from '../../services/qrParser'
import { addClaimedReward } from '../../services/rewardStorage'
import { claimScanReward, claimPanicafeBox } from '../../services/rewardApi'
import { isPanicafeReward } from '../../utils/panicafeCoupons'
import { useStreak } from '../../hooks/useStreak'
import { useLanguage } from '../../contexts/LanguageContext'
import { colors } from '../../constants'

const bondumLogo = require('../../assets/bondum_logo.png')

function truncateUsername(name: string, max = 18): string {
  return name.length > max ? name.slice(0, max) + '...' : name
}

function ScanLine() {
  const translateY = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 220, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start()
  }, [translateY])
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: '15%',
        right: '15%',
        height: 2,
        top: '15%',
        backgroundColor: '#8B5CF6',
        opacity: 0.8,
        borderRadius: 1,
        transform: [{ translateY }],
      }}
    />
  )
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, address, provider, getPrivyAccessToken } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading } = useBondumBalance()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [parsedReward, setParsedReward] = useState<ParsedQrReward | null>(null)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null)
  const [streakInfo, setStreakInfo] = useState<{ multiplier: number; streakBonus: number; currentStreak: number; milestoneReached: string | null; milestoneBonus: number } | null>(null)
  const { logScan } = useStreak()
  const { t } = useLanguage()

  // Demo: auto-trigger fake scan after 2 seconds in guest mode
  useEffect(() => {
    if (provider !== 'guest' || scanned || parsedReward || rewardClaimed) return
    const timer = setTimeout(() => {
      setScanned(true)
      setParsedReward({
        brand: 'PaniCafe',
        type: 'token',
        value: 'PANICAFE REWARD',
        title: 'PaniCafe Box Reward',
        tokenAmount: 150,
        nonce: 'demo-box-token',
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [scanned, parsedReward, rewardClaimed])

  const displayName = truncateUsername(user?.username || 'User')

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const parsed = parseQrCode(data)
    if (parsed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setParsedReward(parsed)
    } else {
      Alert.alert(t('scan.invalidQr'), t('scan.invalidQrMessage'))
      setScanned(false)
    }
  }

  const handleClaimReward = async () => {
    if (!parsedReward) return
    setIsClaiming(true)

    try {
      if (address && parsedReward.tokenAmount) {
        let result
        if (parsedReward.brand === 'PaniCafe' && parsedReward.nonce) {
          const privyToken = provider === 'privy' ? await getPrivyAccessToken() : null
          result = await claimPanicafeBox({
            boxToken: parsedReward.nonce,
            userWallet: address,
            privyToken,
          })
        } else {
          result = await claimScanReward({
            walletAddress: address,
            brand: parsedReward.brand,
            type: parsedReward.type,
            value: parsedReward.value,
            tokenAmount: parsedReward.tokenAmount,
            nonce: parsedReward.nonce,
            signature: parsedReward.sig,
          })
        }
        setTxSignature(result.txSignature)
        if (result.tokenAmount) setClaimedAmount(result.tokenAmount)

        const r = result as any
        if (r.multiplier) {
          setStreakInfo({
            multiplier: r.multiplier,
            streakBonus: r.streakBonus || 0,
            currentStreak: r.currentStreak || 0,
            milestoneReached: r.milestoneReached || null,
            milestoneBonus: r.milestoneBonus || 0,
          })
        }

        queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
        queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
        queryClient.invalidateQueries({ queryKey: ['serverStreak'] })
      }

      await logScan()

      await addClaimedReward({
        id: Date.now().toString(),
        brand: parsedReward.brand,
        type: parsedReward.type,
        value: parsedReward.value,
        claimedAt: new Date().toISOString(),
        txSignature: txSignature || undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setRewardClaimed(true)
    } catch (error: any) {
      Alert.alert(t('scan.claimFailed'), error?.message || t('scan.claimFailedMessage'))
    } finally {
      setIsClaiming(false)
    }
  }

  const resetScanner = () => {
    setScanned(false)
    setParsedReward(null)
    setRewardClaimed(false)
    setTxSignature(null)
    setStreakInfo(null)
    setClaimedAmount(null)
  }

  // ─── Compact Header (shared across all scan states) ──────────────────────
  const ScanHeader = () => (
    <View className="px-5 pb-4 rounded-b-3xl" style={{ paddingTop: insets.top + 12, backgroundColor: colors.background.header }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <View className="flex-row items-center gap-1">
            <ChevronBack size={28} color="white" />
            <Text className="text-white font-bold" style={{ fontSize: 18 }}>{t('common.back')}</Text>
          </View>
        </Pressable>
        <Image source={bondumLogo} style={{ width: 100, height: 40, resizeMode: 'contain' }} />
        <View style={{ width: 70 }}>
          <Text className="text-violet-200 text-right text-xs" numberOfLines={1}>{displayName}</Text>
          <Text className="text-white text-right font-bold text-xs">
            {isBalanceLoading ? '...' : bondumBalance.toLocaleString()} $BONDUM
          </Text>
        </View>
      </View>
    </View>
  )

  // ─── Demo: show scanner UI without camera in guest mode ─────────────
  if (provider === 'guest' && !parsedReward && !rewardClaimed) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />
        <View className="flex-1 px-5 pt-4">
          <Text className="text-center mb-4">
            <Text className="text-violet-500 font-bold italic" style={{ fontSize: 28 }}>{t('scan.title')} </Text>
            <Text className="text-gray-900 font-extrabold" style={{ fontSize: 28 }}>{t('scan.titleSuffix')}</Text>
          </Text>
          <View className="rounded-2xl overflow-hidden relative" style={{ width: '100%', aspectRatio: 1, backgroundColor: '#1e1b4b' }}>
            <View className="absolute inset-0 items-center justify-center">
              <View className="w-64 h-64">
                <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-violet-500 rounded-tl-lg" />
                <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-violet-500 rounded-tr-lg" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-violet-500 rounded-bl-lg" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-violet-500 rounded-br-lg" />
              </View>
            </View>
            <ScanLine />
          </View>
          <Text className="text-gray-400 text-center mt-6" style={{ fontSize: 15, lineHeight: 22 }}>
            {t('scan.scanDescription')}
          </Text>
        </View>
      </View>
    )
  }

  // ─── Permission request ──────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">{t('scan.cameraRequesting')}</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83D\uDCF7'}</Text>
          <Text className="text-gray-900 text-xl font-bold text-center mb-3">{t('scan.cameraRequired')}</Text>
          <Text className="text-gray-500 text-center mb-6">
            {t('scan.cameraDescription')}
          </Text>
          <Button variant="primary" size="lg" onPress={requestPermission}>
            {t('scan.grantPermission')}
          </Button>
        </View>
      </View>
    )
  }

  // ─── Reward preview / claimed state ──────────────────────────────────────
  if (parsedReward) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />

        <View className="flex-1 px-5" style={{ paddingTop: 16 }}>
          {rewardClaimed ? (
            // ── Claimed: show confirmation ──
            <View className="flex-1 justify-center">
              <View
                className="bg-white rounded-3xl"
                style={{ padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
              >
                {txSignature ? (
                  <>
                    <TransactionConfirmation
                      signature={txSignature}
                      title={t('scan.rewardClaimed')}
                      message={`+${(claimedAmount || parsedReward.tokenAmount || '').toLocaleString()} ${isPanicafeReward(parsedReward.brand) ? 'PaniCafe' : 'Bondum'} ${t('scan.points', { brand: '' }).trim()}`}
                      onDone={() => router.replace('/(tabs)/(rewards)')}
                      onScanAnother={resetScanner}
                    />
                    {streakInfo && (streakInfo.streakBonus > 0 || streakInfo.milestoneReached) && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                        {streakInfo.streakBonus > 0 && (
                          <View style={{ backgroundColor: '#f5f3ff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, borderWidth: 1, borderColor: '#ddd6fe' }}>
                            <Text style={{ color: '#6d28d9', fontWeight: '700', textAlign: 'center', fontSize: 13 }}>
                              {t('scan.streakBonusMessage', { bonus: streakInfo.streakBonus, multiplier: streakInfo.multiplier.toFixed(1) })}
                            </Text>
                          </View>
                        )}
                        {streakInfo.milestoneReached && (
                          <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#fde68a' }}>
                            <Text style={{ color: '#b45309', fontWeight: '700', textAlign: 'center', fontSize: 13 }}>
                              {t('scan.milestoneBonusMessage', { milestone: streakInfo.milestoneReached || '', bonus: streakInfo.milestoneBonus })}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <View className="items-center" style={{ paddingVertical: 32 }}>
                    <ScalePulse>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Text style={{ fontSize: 40, color: '#10b981' }}>{'\u2713'}</Text>
                    </View>
                    </ScalePulse>
                    <Text className="text-gray-900 font-bold text-center" style={{ fontSize: 24, marginBottom: 6 }}>{t('scan.rewardClaimed')}</Text>
                    <Text className="text-gray-500 text-center" style={{ fontSize: 15, marginBottom: 28 }}>
                      {t('scan.valueFromBrand', { value: parsedReward.value, brand: parsedReward.brand })}
                    </Text>
                    <View className="flex-row gap-3" style={{ width: '100%', paddingHorizontal: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Button variant="outline" onPress={resetScanner} style={{ width: '100%', minHeight: 48 }}>
                          <Text style={{ fontSize: 16 }}>{t('scan.scanAnother')}</Text>
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button variant="primary" onPress={() => router.replace('/(tabs)/(rewards)')} style={{ width: '100%', minHeight: 48 }}>
                          <Text style={{ fontSize: 16, color: '#FFFFFF' }}>{t('scan.viewRewards')}</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            // ── Pre-claim: show reward preview ──
            <View className="flex-1 justify-center">
              <FadeIn>
              <View
                className="bg-white rounded-3xl items-center"
                style={{ padding: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
              >
                {/* Brand badge */}
                <View
                  style={{
                    backgroundColor: isPanicafeReward(parsedReward.brand) ? '#fef3c7' : '#ede9fe',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '700',
                      fontSize: 13,
                      color: isPanicafeReward(parsedReward.brand) ? '#92400e' : '#6d28d9',
                    }}
                  >
                    {parsedReward.brand}
                  </Text>
                </View>

                {/* Reward title */}
                <Text className="text-gray-900 font-bold text-center" style={{ fontSize: 20, marginBottom: 20 }}>
                  {parsedReward.title}
                </Text>

                {/* Value display — big hero number */}
                <View
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    paddingVertical: 28,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    backgroundColor: isPanicafeReward(parsedReward.brand) ? '#d97706' : parsedReward.type === 'nft' ? '#111827' : '#7c3aed',
                    marginBottom: 20,
                  }}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                    {t('scan.youWillReceive')}
                  </Text>
                  <Text className="text-white font-extrabold text-center" style={{ fontSize: 36 }}>
                    {parsedReward.tokenAmount ? `${parsedReward.tokenAmount.toLocaleString()}` : parsedReward.value}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {t('scan.points', { brand: isPanicafeReward(parsedReward.brand) ? 'PaniCafe' : parsedReward.brand !== 'Bondum' ? parsedReward.brand : 'Bondum' })}
                  </Text>
                </View>

                {/* Action buttons */}
                <View className="flex-row gap-3" style={{ width: '100%' }}>
                  <View style={{ flex: 1 }}>
                    <Button variant="outline" onPress={resetScanner} style={{ width: '100%', minHeight: 48 }}>
                      <Text style={{ fontSize: 16 }}>{t('common.cancel')}</Text>
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button variant="primary" onPress={handleClaimReward} loading={isClaiming} style={{ width: '100%', minHeight: 48 }}>
                      <Text style={{ fontSize: 16, color: '#FFFFFF' }}>{t('common.claim')}</Text>
                    </Button>
                  </View>
                </View>
              </View>
              </FadeIn>
            </View>
          )}
        </View>

        <View style={{ paddingBottom: insets.bottom + 8 }} />
      </View>
    )
  }

  // ─── Scanner view ────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50">
      <ScanHeader />

      <View className="flex-1 px-5 pt-4">
        <Text className="text-center mb-4">
          <Text className="text-violet-500 font-bold italic" style={{ fontSize: 28 }}>{t('scan.title')} </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 28 }}>{t('scan.titleSuffix')}</Text>
        </Text>

        <View className="rounded-2xl overflow-hidden bg-gray-200 relative" style={{ width: '100%', aspectRatio: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          {/* Scanner Overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-64 h-64">
              <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-violet-500 rounded-tl-lg" />
              <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-violet-500 rounded-tr-lg" />
              <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-violet-500 rounded-bl-lg" />
              <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-violet-500 rounded-br-lg" />
            </View>
          </View>
          <ScanLine />
        </View>

        <Text className="text-gray-400 text-center mt-6" style={{ fontSize: 15, lineHeight: 22 }}>
          {t('scan.scanDescription')}
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom + 16 }} />
    </View>
  )
}
