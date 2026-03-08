import { View, Text, Pressable, StyleSheet, Image, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useBondumBalance } from '../../hooks/useBondumBalance'
import { Button } from '../../components/ui'
import { TransactionConfirmation } from '../../components/TransactionConfirmation'
import { parseQrCode, type ParsedQrReward } from '../../services/qrParser'
import { addClaimedReward } from '../../services/rewardStorage'
import { claimScanReward, claimPanicafeBox } from '../../services/rewardApi'
import { PanicafeCouponCard } from '../../components/PanicafeCouponCard'
import { isPanicafeReward } from '../../utils/panicafeCoupons'
import { useStreak } from '../../hooks/useStreak'

const bondumLogo = require('../../assets/bondum_logo.png')

function truncateUsername(name: string, max = 18): string {
  return name.length > max ? name.slice(0, max) + '...' : name
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
  const [streakInfo, setStreakInfo] = useState<{ multiplier: number; streakBonus: number; currentStreak: number; milestoneReached: string | null; milestoneBonus: number } | null>(null)
  const { logScan } = useStreak()

  const displayName = truncateUsername(user?.username || 'User')

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    const parsed = parseQrCode(data)
    if (parsed) {
      setParsedReward(parsed)
    } else {
      Alert.alert('Invalid QR Code', 'This QR code is expired or does not contain a valid reward.')
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
      setRewardClaimed(true)
    } catch (error: any) {
      Alert.alert('Claim Failed', error?.message || 'Failed to claim reward. Please try again.')
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
  }

  // ─── Compact Header (shared across all scan states) ──────────────────────
  const ScanHeader = () => (
    <View className="px-5 pb-4 rounded-b-3xl" style={{ paddingTop: insets.top + 12, backgroundColor: '#8b66df' }}>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-white font-bold" style={{ fontSize: 28 }}>{'<'} Back</Text>
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

  // ─── Permission request ──────────────────────────────────────────────────
  if (!permission) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-gray-50">
        <ScanHeader />
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text className="text-gray-900 text-xl font-bold text-center mb-3">Camera Permission Required</Text>
          <Text className="text-gray-500 text-center mb-6">
            We need camera access to scan QR codes and unlock rewards.
          </Text>
          <Button variant="primary" size="lg" onPress={requestPermission}>
            Grant Permission
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

        <View className="flex-1 px-5 pt-6">
          {rewardClaimed ? (
            // ── Claimed: show confirmation ──
            <View className="flex-1">
              <View className="bg-white rounded-3xl flex-1" style={{ padding: 24, maxHeight: 520 }}>
                {txSignature ? (
                  <>
                    {isPanicafeReward(parsedReward.brand) && (
                      <PanicafeCouponCard value={parsedReward.value} size="sm" style={{ marginBottom: 12 }} />
                    )}
                    <TransactionConfirmation
                      signature={txSignature}
                      title="Reward Claimed!"
                      message={`${parsedReward.tokenAmount || ''} ${parsedReward.brand} tokens sent to your wallet`}
                      onDone={() => router.replace('/(tabs)/(rewards)')}
                      onScanAnother={resetScanner}
                    />
                    {streakInfo && (
                      <View className="mt-2">
                        {streakInfo.streakBonus > 0 && (
                          <View className="bg-violet-50 rounded-xl px-4 py-3 mb-2" style={{ borderWidth: 1, borderColor: '#ddd6fe' }}>
                            <Text className="text-violet-700 font-bold text-center" style={{ fontSize: 13 }}>
                              🔥 +{streakInfo.streakBonus} streak bonus ({streakInfo.multiplier.toFixed(1)}x)
                            </Text>
                          </View>
                        )}
                        {streakInfo.milestoneReached && (
                          <View className="bg-amber-50 rounded-xl px-4 py-3" style={{ borderWidth: 1, borderColor: '#fde68a' }}>
                            <Text className="text-amber-700 font-bold text-center" style={{ fontSize: 13 }}>
                              🎉 {streakInfo.milestoneReached}! +{streakInfo.milestoneBonus} bonus
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-green-500" style={{ fontSize: 80 }}>{'\u2713'}</Text>
                    <Text className="text-gray-900 font-bold text-center mb-2" style={{ fontSize: 24 }}>Reward Claimed!</Text>
                    <Text className="text-gray-500 text-center mb-8" style={{ fontSize: 15 }}>
                      {parsedReward.value} from {parsedReward.brand} saved to your account.
                    </Text>
                    <View className="flex-row gap-3">
                      <Button variant="outline" onPress={resetScanner}>
                        <Text style={{ fontSize: 16 }}>Scan Another</Text>
                      </Button>
                      <Button variant="primary" onPress={() => router.replace('/(tabs)/(rewards)')}>
                        <Text style={{ fontSize: 16, color: '#FFFFFF' }}>View Rewards</Text>
                      </Button>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            // ── Pre-claim: show reward preview ──
            <View className="flex-1">
              <View className="bg-white rounded-3xl flex-1 items-center justify-center" style={{ padding: 28, maxHeight: 480 }}>
                {/* Brand badge */}
                <View className={`rounded-full px-6 py-2 mb-4 ${isPanicafeReward(parsedReward.brand) ? 'bg-amber-100' : 'bg-violet-100'}`}>
                  <Text className={`font-bold ${isPanicafeReward(parsedReward.brand) ? 'text-amber-700' : 'text-violet-600'}`} style={{ fontSize: 14 }}>{parsedReward.brand}</Text>
                </View>

                {/* Reward title */}
                <Text className="text-gray-900 font-bold text-center mb-5" style={{ fontSize: 22 }}>
                  {parsedReward.title}
                </Text>

                {/* Value display */}
                {isPanicafeReward(parsedReward.brand) ? (
                  <PanicafeCouponCard value={parsedReward.value} size="md" style={{ width: '100%', marginBottom: 8 }} />
                ) : (
                  <View
                    className="rounded-2xl items-center justify-center w-full mb-2"
                    style={{
                      paddingVertical: 32,
                      paddingHorizontal: 24,
                      backgroundColor: parsedReward.type === 'nft' ? '#111827' : '#7c3aed',
                    }}
                  >
                    <Text className="text-white font-extrabold text-center" style={{ fontSize: 32 }}>
                      {parsedReward.tokenAmount ? `${parsedReward.tokenAmount} TOKENS` : parsedReward.value}
                    </Text>
                    {parsedReward.brand !== 'Bondum' && (
                      <Text className="text-violet-200 font-medium mt-1" style={{ fontSize: 14 }}>
                        {parsedReward.brand}
                      </Text>
                    )}
                  </View>
                )}

                {/* Token type label */}
                <Text className="text-gray-400 text-xs uppercase mb-6">{parsedReward.type} reward</Text>

                {/* Action buttons */}
                <View className="flex-row gap-3 w-full">
                  <View className="flex-1">
                    <Button variant="outline" onPress={resetScanner} style={{ width: '100%' }}>
                      <Text style={{ fontSize: 16 }}>Cancel</Text>
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button variant="primary" onPress={handleClaimReward} loading={isClaiming} style={{ width: '100%' }}>
                      <Text style={{ fontSize: 16, color: '#FFFFFF' }}>Claim Reward</Text>
                    </Button>
                  </View>
                </View>
              </View>
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
          <Text className="text-violet-500 font-bold italic" style={{ fontSize: 28 }}>SCAN </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 28 }}>YOUR CODE</Text>
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
        </View>

        <Text className="text-gray-400 text-center mt-6" style={{ fontSize: 15, lineHeight: 22 }}>
          Scan a QR code to earn $BONDUM{'\n'}and loyalty tokens from your favorite brands.
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom + 16 }} />
    </View>
  )
}
