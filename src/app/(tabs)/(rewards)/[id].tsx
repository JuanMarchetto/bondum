import { View, Text, Pressable, Image, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useReward } from '../../../hooks/useRewards'
import { addClaimedReward } from '../../../services/rewardStorage'
import { requestRedemption, redeemReward } from '../../../services/rewardApi'
import { Button, Avatar, BellIcon } from '../../../components/ui'
import { TransactionConfirmation } from '../../../components/TransactionConfirmation'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction, Connection } from '@solana/web3.js'
import { getTransactionDecoder } from '@solana/kit'
import { Buffer } from 'buffer'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')

export default function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, address, provider } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading } = useBondumBalance()
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

  const handleClaim = async () => {
    if (!user || !address) {
      Alert.alert('Error', 'Please connect a wallet first.')
      return
    }
    if (bondumBalance < reward.cost) {
      Alert.alert('Insufficient Balance', `You need ${reward.cost - bondumBalance} more $BONDUM.`)
      return
    }
    setIsClaiming(true)
    try {
      // Step 1: Request partially-signed transaction from server
      const redemptionRequest = await requestRedemption({
        walletAddress: address,
        rewardId: reward.id,
        brand: reward.brand,
      })

      // Step 2: Sign with user's wallet
      const txBytes = Buffer.from(redemptionRequest.serializedTransaction, 'base64')

      if (provider === 'solana' && mobileWallet.account) {
        // MWA signing
        const decoder = getTransactionDecoder()
        const decodedTx = decoder.decode(txBytes)
        const signatures = await mobileWallet.signAndSendTransaction(decodedTx, BigInt(0))
        if (!signatures || signatures.length === 0) throw new Error('Wallet did not return a signature')
        const sigArray = Array.from(signatures[0] as Uint8Array)
        const sig = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        setTxSignature(sig)

        // Store locally for history
        await addClaimedReward({
          id: `reward-${reward.id}-${Date.now()}`,
          brand: reward.brand,
          type: reward.type,
          value: reward.value,
          claimedAt: new Date().toISOString(),
          txSignature: sig,
        })
        setClaimed(true)

        queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
        queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
        queryClient.invalidateQueries({ queryKey: ['rewards'] })
        return
      } else if (provider === 'privy' && embeddedSolanaWallet.status === 'connected') {
        // Privy signing
        const transaction = VersionedTransaction.deserialize(txBytes)
        const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        const conn = new Connection(RPC_URL, 'confirmed')
        const privyProvider = await embeddedSolanaWallet.getProvider()
        const result = await privyProvider.request({
          method: 'signAndSendTransaction',
          params: { transaction, connection: conn },
        })
        setTxSignature(result.signature)

        await addClaimedReward({
          id: `reward-${reward.id}-${Date.now()}`,
          brand: reward.brand,
          type: reward.type,
          value: reward.value,
          claimedAt: new Date().toISOString(),
          txSignature: result.signature,
        })
        setClaimed(true)

        queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
        queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
        queryClient.invalidateQueries({ queryKey: ['rewards'] })
        return
      }

      // Fallback: legacy server-side redemption
      const result = await redeemReward({
        walletAddress: address,
        rewardId: reward.id,
        brand: reward.brand,
      })
      setTxSignature(result.txSignature)

      await addClaimedReward({
        id: `reward-${reward.id}-${Date.now()}`,
        brand: reward.brand,
        type: reward.type,
        value: reward.value,
        claimedAt: new Date().toISOString(),
        txSignature: result.txSignature || undefined,
      })
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
        {/* Header */}
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="items-center mb-4">
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-bold" style={{ fontSize: 24 }}>Hello, {user?.username || 'User'}!</Text>
              <Text className="text-violet-200" style={{ fontSize: 19 }}>{bondumBalance.toLocaleString()} $BONDUM</Text>
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
        <View className="flex-1 items-center px-6" style={{ paddingTop: 50 }}>
          <View className="items-center bg-white rounded-2xl shadow-sm" style={{ paddingVertical: 60, paddingHorizontal: 24, width: '100%' }}>
            {txSignature ? (
              <TransactionConfirmation
                signature={txSignature}
                title="Reward Redeemed!"
                message={`You've won: ${reward.value}`}
                onDone={() => router.replace('/(tabs)/(rewards)')}
                simplified={provider === 'privy'}
              />
            ) : (
              <>
                <Text className="text-gray-500 mb-2" style={{ fontSize: 36 }}>You&apos;ve Won</Text>
                <Text className="text-center mb-6">
                  <Text className="text-gray-900 font-bold" style={{ fontSize: 48 }}>A </Text>
                  <Text className="text-violet-500 font-extrabold" style={{ fontSize: 48 }}>
                    {reward.type === 'nft' ? 'ULTRA RARE ' : ''}
                  </Text>
                  <Text className="text-gray-900 font-bold" style={{ fontSize: 48 }}>{reward.type === 'nft' ? 'NFT' : 'REWARD'}</Text>
                </Text>

                {reward.type === 'token' ? (
                  <View className="bg-gray-1000 rounded-2xl px-12 py-8 mb-6">
                    <Text className="text-white font-extrabold" style={{ fontSize: 60 }}>{reward.value}</Text>
                  </View>
                ) : reward.type === 'nft' ? (
                  <View className="bg-violet-100 rounded-2xl p-6 mb-6 border-4 border-violet-500">
                    <View className="w-48 h-48 bg-violet-400 rounded-xl items-center justify-center">
                      <Text className="text-white font-extrabold" style={{ fontSize: 80 }}>NFT</Text>
                      <Text className="text-white font-bold mt-2" style={{ fontSize: 32 }}>BONDUM</Text>
                    </View>
                  </View>
                ) : (
                  <View className="bg-red-600 rounded-2xl px-12 py-8 mb-6">
                    <Text className="text-white font-extrabold" style={{ fontSize: 60 }}>{reward.value}</Text>
                  </View>
                )}

                <Button variant="primary" size="lg" style={{ paddingVertical: 32, borderRadius: 12, marginTop: 24 }} onPress={() => router.replace('/(tabs)/(rewards)')}>
                  <Text className="text-white font-bold" style={{ fontSize: 36 }}>Back to Rewards</Text>
                </Button>
              </>
            )}
          </View>
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
            <Text className="text-violet-200">~ {bondumBalance.toLocaleString()} $BONDUM</Text>
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
              disabled={bondumBalance < reward.cost}
            >
              <Text className="text-white font-bold text-4xl">Claim reward</Text>
            </Button>
          </View>

          {bondumBalance < reward.cost && (
            <Text className="text-red-500 text-center mt-3 text-sm">
              Not enough $BONDUM tokens. You need {reward.cost - bondumBalance} more.
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
