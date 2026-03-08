import { View, Text, Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { useReward } from '../../../hooks/useRewards'
import { addClaimedReward } from '../../../services/rewardStorage'
import { requestRedemption, redeemReward, requestPanicafeRewardClaim, submitPanicafeRewardClaim } from '../../../services/rewardApi'
import { Button } from '../../../components/ui'
import { Header } from '../../../components/layout/Header'
import { TransactionConfirmation } from '../../../components/TransactionConfirmation'
import { PanicafeCouponCard } from '../../../components/PanicafeCouponCard'
import { isPanicafeReward, getPanicafeRewardKind } from '../../../utils/panicafeCoupons'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction, Transaction, Connection } from '@solana/web3.js'
import { getTransactionDecoder } from '@solana/kit'
import { Buffer } from 'buffer'
import bs58 from 'bs58'

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, address, provider, getPrivyAccessToken } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading } = useBondumBalance()
  const { tokens } = useTokenBalances()
  const panicafeBalance = tokens.find((t) => t.symbol === 'PANICAFE')?.balance ?? 0
  const { reward: fetchedReward } = useReward(id || '1')
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const reward = fetchedReward || {
    id: id || '1',
    brand: 'Bondum',
    type: 'discount' as const,
    title: 'Reward',
    description: '',
    value: '',
    cost: 0,
    available: 0,
  }

  const mobileWallet = useMobileWallet()
  const embeddedSolanaWallet = useEmbeddedSolanaWallet()

  const isPanicafe = isPanicafeReward(reward.brand)
  const activeBalance = isPanicafe ? panicafeBalance : bondumBalance
  const tokenSymbol = isPanicafe ? '$PANICAFE' : '$BONDUM'

  const handleClaimPanicafe = async () => {
    if (!address) throw new Error('No wallet connected')
    if (provider !== 'privy' || embeddedSolanaWallet.status !== 'connected') {
      throw new Error('PaniCafe coupon redemption requires a Privy wallet.')
    }

    const rewardKind = getPanicafeRewardKind(reward.value)
    if (!rewardKind) throw new Error('This reward cannot be redeemed through PaniCafe yet.')

    const privyToken = await getPrivyAccessToken()

    // Step 1: Request partially-signed tx from PaniCafe API
    const claimRequest = await requestPanicafeRewardClaim({
      rewardKind,
      userWalletAddress: address,
      privyToken,
    })

    // Step 2: Decode base58 legacy Transaction and sign with Privy
    const transaction = Transaction.from(bs58.decode(claimRequest.serializedTransaction))
    const privyProvider = await embeddedSolanaWallet.getProvider()
    const result = await privyProvider.request({
      method: 'signTransaction',
      params: { transaction },
    })

    // Step 3: Extract user's signature (index 1, vault is index 0)
    const signedTx = (result as any).signedTransaction ?? result
    const userSig = (signedTx as Transaction).signatures[1]?.signature
    if (!userSig) throw new Error('Wallet did not produce a signature')
    const sigBase64 = Buffer.from(userSig).toString('base64')

    // Step 4: Submit signature to PaniCafe server (server submits on-chain)
    const claimResult = await submitPanicafeRewardClaim({
      signature: sigBase64,
      rewardId: claimRequest.id,
      privyToken,
    })

    return claimResult.signature
  }

  const handleClaimBondum = async () => {
    if (!address) throw new Error('No wallet connected')

    // Step 1: Request partially-signed transaction from Bondum server
    const redemptionRequest = await requestRedemption({
      walletAddress: address,
      rewardId: reward.id,
      brand: reward.brand,
    })

    // Step 2: Sign with user's wallet
    const txBytes = Buffer.from(redemptionRequest.serializedTransaction, 'base64')

    if (provider === 'solana' && mobileWallet.account) {
      const decoder = getTransactionDecoder()
      const decodedTx = decoder.decode(txBytes)
      const signatures = await mobileWallet.signAndSendTransaction(decodedTx, BigInt(0))
      if (!signatures || signatures.length === 0) throw new Error('Wallet did not return a signature')
      const sigArray = Array.from(signatures[0] as Uint8Array)
      return sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } else if (provider === 'privy' && embeddedSolanaWallet.status === 'connected') {
      const transaction = VersionedTransaction.deserialize(txBytes)
      const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
      const conn = new Connection(RPC_URL, 'confirmed')
      const privyProvider = await embeddedSolanaWallet.getProvider()
      const result = await privyProvider.request({
        method: 'signAndSendTransaction',
        params: { transaction, connection: conn },
      })
      return result.signature
    }

    // Fallback: legacy server-side redemption
    const result = await redeemReward({
      walletAddress: address,
      rewardId: reward.id,
      brand: reward.brand,
    })
    return result.txSignature || ''
  }

  const handleClaim = async () => {
    if (!user || !address) {
      Alert.alert('Error', 'Please connect a wallet first.')
      return
    }
    if (activeBalance < reward.cost) {
      Alert.alert('Insufficient Balance', `You need ${reward.cost - activeBalance} more ${tokenSymbol}.`)
      return
    }
    setIsClaiming(true)
    try {
      const sig = isPanicafe ? await handleClaimPanicafe() : await handleClaimBondum()
      setTxSignature(sig)

      await addClaimedReward({
        id: `reward-${reward.id}-${Date.now()}`,
        brand: reward.brand,
        type: reward.type,
        value: reward.value,
        claimedAt: new Date().toISOString(),
        txSignature: sig || undefined,
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setClaimed(true)

      queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to claim reward. Please try again.')
    } finally {
      setIsClaiming(false)
    }
  }

  if (claimed) {
    return (
      <View className="flex-1 bg-gray-100">
        <Header
          userName={user?.username || 'User'}
          balance={bondumBalance.toLocaleString()}
        />

        {/* Celebration View */}
        <View className="flex-1 justify-center px-5">
          <View
            className="bg-white rounded-3xl"
            style={{ paddingVertical: 24, paddingHorizontal: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
          >
            {txSignature ? (
              <>
                {isPanicafe && (
                  <PanicafeCouponCard value={reward.value} cost={reward.cost} size="sm" style={{ marginHorizontal: 16, marginBottom: 4 }} />
                )}
                <TransactionConfirmation
                  signature={txSignature}
                  title="Reward Redeemed!"
                  message={isPanicafe ? `Coupon: ${reward.value}` : `You've won: ${reward.value}`}
                  onDone={() => router.replace('/(tabs)/(rewards)')}
                />
              </>
            ) : (
              <View className="items-center" style={{ paddingVertical: 20 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 40, color: '#10b981' }}>{'\u2713'}</Text>
                </View>

                <Text className="text-gray-900 font-bold text-center" style={{ fontSize: 24, marginBottom: 8 }}>
                  {"You've Won a Reward!"}
                </Text>

                {isPanicafe ? (
                  <PanicafeCouponCard value={reward.value} cost={reward.cost} size="md" style={{ marginBottom: 24, width: '100%' }} />
                ) : reward.type === 'nft' ? (
                  <View style={{ backgroundColor: '#ede9fe', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 3, borderColor: '#8b5cf6' }}>
                    <View style={{ width: 160, height: 160, backgroundColor: '#8b5cf6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 56 }}>NFT</Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: reward.type === 'token' ? '#111827' : '#dc2626',
                      borderRadius: 16,
                      paddingHorizontal: 32,
                      paddingVertical: 20,
                      marginBottom: 24,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 36, textAlign: 'center' }}>{reward.value}</Text>
                  </View>
                )}

                <Button variant="primary" size="lg" style={{ paddingVertical: 18, borderRadius: 14, width: '100%' }} onPress={() => router.replace('/(tabs)/(rewards)')}>
                  <Text className="text-white font-bold" style={{ fontSize: 18 }}>Back to Rewards</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-100">
      <Header
        userName={user?.username || 'User'}
        balance={`~ ${bondumBalance.toLocaleString()}`}
        showBackButton
      />

      {/* Reward Detail */}
      <View className="flex-1 px-2 pt-6 justify-center">
        <View className="bg-white rounded-3xl p-5 self-center" style={{ borderWidth: 1, borderColor: '#9b9db5', flex: 0.9, width: '96%' }}>
          <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
            <Text className="text-4xl font-extrabold">
              <Text className="text-gray-900">{reward.cost.toLocaleString()} </Text>
              <Text style={{ color: isPanicafeReward(reward.brand) ? '#d97706' : '#8b5cf6' }}>
                {isPanicafeReward(reward.brand) ? '$PANICAFE' : '$BONDUM'}
              </Text>
            </Text>
            <View style={{ borderWidth: 4, borderColor: '#8b5cf6', borderRadius: 12, backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text className="text-2xl font-extrabold" style={{ color: '#8b5cf6' }}>{reward.available} available</Text>
            </View>
          </View>

          <Text className="text-gray-900 font-semibold text-3xl" style={{ marginTop: 12, marginBottom: 48 }}>{reward.description}</Text>

          {isPanicafeReward(reward.brand) ? (
            <PanicafeCouponCard value={reward.value} cost={reward.cost} size="lg" style={{ marginBottom: 24 }} />
          ) : (
            <View
              className={`rounded-xl py-32 items-center mb-6 ${reward.type === 'nft' ? 'bg-gray-1000' : 'bg-red-600'}`}
            >
              <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
            </View>
          )}

          <View className="items-center">
            <Button
              variant="primary"
              size="lg"
              className="w-[66%]"
              style={{ paddingVertical: 20, borderRadius: 20 }}
              onPress={handleClaim}
              loading={isClaiming}
              disabled={activeBalance < reward.cost}
            >
              <Text className="text-white font-bold text-4xl">Claim reward</Text>
            </Button>
          </View>

          {activeBalance < reward.cost && (
            <Text className="text-red-500 text-center mt-3 text-sm">
              Not enough {tokenSymbol} tokens. You need {reward.cost - activeBalance} more.
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
