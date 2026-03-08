import { View, Text, TextInput, Pressable, Image, Modal, Alert, ScrollView } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { Button, Avatar, BellIcon } from '../../../components/ui'
import { TransactionConfirmation } from '../../../components/TransactionConfirmation'
import { useSwapQuote, type TokenSymbol, TOKENS } from '../../../hooks/useSwapQuote'
import { getSwapTransaction } from '../../../services/jupiter'
import { getTransactionDecoder } from '@solana/kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { Buffer } from 'buffer'
import { VersionedTransaction, Connection } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')
const bLogo = require('../../../assets/b-logo.png')
const swapArrows = require('../../../assets/swap_arrows.png')
const usdcCoin = require('../../../assets/usd-coin.png')
const solLogo = require('../../../assets/sol-logo.png')
const panicoinSvg = require('../../../assets/panicoin.svg')

// Token icons mapping
const TOKEN_ICONS: Record<TokenSymbol, { source: any; isSvg?: boolean }> = {
  SOL: { source: solLogo },
  USDC: { source: usdcCoin },
  BONDUM: { source: bLogo },
  PANICAFE: { source: panicoinSvg, isSvg: true },
}

export default function TradeScreen() {
  const insets = useSafeAreaInsets()
  const { user, address, provider } = useAuth()
  const queryClient = useQueryClient()
  const { balance: bondumBalance, isLoading: isBalanceLoading } = useBondumBalance()
  const { tokens } = useTokenBalances()
  const mobileWallet = useMobileWallet()
  const embeddedSolanaWallet = useEmbeddedSolanaWallet()

  const [fromToken, setFromToken] = useState<TokenSymbol>('BONDUM')
  const [toToken, setToToken] = useState<TokenSymbol>('USDC')
  const [fromAmount, setFromAmount] = useState('')
  const [showTokenPicker, setShowTokenPicker] = useState<'from' | 'to' | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [completedSwapTx, setCompletedSwapTx] = useState<string | null>(null)

  const { quote, toAmount, priceImpact, isLoading: isQuoteLoading, error: quoteError } = useSwapQuote(
    fromToken,
    toToken,
    fromAmount,
  )

  // Get token balance for display
  const getTokenBalance = (symbol: TokenSymbol): number => {
    if (symbol === 'SOL') {
      // SOL balance would need to be fetched separately or from tokens
      const solToken = tokens.find((t) => t.symbol === 'SOL')
      return solToken?.balance || 0
    }
    const token = tokens.find((t) => t.symbol === symbol)
    return token?.balance || 0
  }

  const handleTokenSelect = (symbol: TokenSymbol) => {
    if (showTokenPicker === 'from') {
      // Don't allow selecting the same token as the other side
      if (symbol !== toToken) {
        setFromToken(symbol)
      }
    } else if (showTokenPicker === 'to') {
      // Don't allow selecting the same token as the other side
      if (symbol !== fromToken) {
        setToToken(symbol)
      }
    }
    setShowTokenPicker(null)
  }

  const handleSwapTokens = () => {
    // Swap tokens and amounts
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount || '')
  }

  const handleSwap = async () => {
    if (!address || !quote || !fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    if (fromToken === toToken) {
      Alert.alert('Error', 'Cannot swap the same token')
      return
    }

    const balance = getTokenBalance(fromToken)
    if (parseFloat(fromAmount) > balance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromToken}`)
      return
    }

    setIsSwapping(true)

    try {
      // Get swap transaction from Jupiter (throws on error with descriptive message)
      const swapTxBase64 = await getSwapTransaction(quote, address)

      // Decode the base64 transaction to bytes
      const txBytes = Buffer.from(swapTxBase64, 'base64')
      let signature: string

      if (provider === 'solana' && mobileWallet.account) {
        // ─── MWA (Mobile Wallet Adapter) ───
        // Decode bytes into @solana/kit Transaction type
        const decoder = getTransactionDecoder()
        const transaction = decoder.decode(txBytes)

        // signAndSendTransaction returns SignatureBytes[]
        const signatures = await mobileWallet.signAndSendTransaction(
          transaction,
          BigInt(0), // minContextSlot
        )

        if (!signatures || signatures.length === 0) {
          throw new Error('Wallet did not return a signature')
        }
        // Convert first SignatureBytes to base58 for display
        const sigArray = Array.from(signatures[0] as Uint8Array)
        signature = sigArray.map(b => b.toString(16).padStart(2, '0')).join('')
      } else if (provider === 'privy' && embeddedSolanaWallet.status === 'connected') {
        // ─── Privy Embedded Wallet ───
        // Uses @solana/web3.js VersionedTransaction (required by Privy SDK)
        const transaction = VersionedTransaction.deserialize(txBytes)

        const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        const connection = new Connection(RPC_URL, 'confirmed')

        // Get the Privy provider and request signing + sending
        const privyProvider = await embeddedSolanaWallet.getProvider()

        const result = await privyProvider.request({
          method: 'signAndSendTransaction',
          params: {
            transaction,
            connection,
          },
        })

        signature = result.signature
      } else {
        throw new Error('No wallet connected. Please reconnect your wallet.')
      }

      // Success — show transaction confirmation
      setFromAmount('')
      setCompletedSwapTx(signature)

      // Invalidate balance caches to trigger fresh refetch
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
      queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to execute swap. Please try again.'
      Alert.alert('Swap Failed', errorMessage)
    } finally {
      setIsSwapping(false)
    }
  }

  const fromTokenInfo = TOKENS[fromToken]
  const toTokenInfo = TOKENS[toToken]
  const fromBalance = getTokenBalance(fromToken)

  if (completedSwapTx) {
    return (
      <View className="flex-1 bg-violet-50">
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="items-center mb-4">
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          </View>
        </View>
        <View className="flex-1 justify-center px-4">
          <View className="bg-white rounded-3xl">
            <TransactionConfirmation
              signature={completedSwapTx}
              title="Swap Successful!"
              message={`Swapped ${fromToken} for ${toToken}`}
              onDone={() => setCompletedSwapTx(null)}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
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

      {/* Swap Card */}
      <View className="flex-1 px-4" style={{ paddingTop: 33.6 }}>
        <View className="mb-4">
          <Text className="text-center mb-6">
            <Text className="text-violet-500 font-bold" style={{ fontSize: 43.2 }}>SWAP </Text>
            <Text className="text-gray-900 font-extrabold" style={{ fontSize: 43.2 }}>YOUR TOKENS</Text>
          </Text>

          {/* From Token */}
          <View className="bg-white rounded-2xl mb-2 self-center" style={{ width: '95%', paddingTop: 0, paddingBottom: 5.184, paddingHorizontal: 16, borderWidth: 1, borderColor: '#9b9db5' }}>
            <View className="flex-row items-center justify-between mb-2">
              <Pressable
                onPress={() => setShowTokenPicker('from')}
                className="flex-row items-center gap-2"
              >
                {TOKEN_ICONS[fromToken].isSvg ? (
                  <ExpoImage source={TOKEN_ICONS[fromToken].source} style={{ width: 24, height: 24 }} contentFit="contain" />
                ) : (
                  <Image source={TOKEN_ICONS[fromToken].source} style={{ width: 24, height: 24 }} />
                )}
                <Text className="font-semibold" style={{ color: '#cbc2e2', fontSize: 18 }}>
                  {fromTokenInfo.symbol}
                </Text>
                <Text style={{ fontSize: 16 }}>▼</Text>
              </Pressable>
              <Text className="text-gray-500 text-sm">Balance: {fromBalance.toFixed(4)}</Text>
            </View>
            <TextInput
              style={{
                fontSize: 100,
                color: '#000000',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: 'transparent',
                width: '100%',
                minHeight: 27,
                marginTop: -15,
                marginBottom: -20,
              }}
              placeholder="0"
              placeholderTextColor="#A3A3A3"
              value={fromAmount}
              onChangeText={(text) => {
                // Allow only numbers and one decimal point
                const formatted = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                setFromAmount(formatted)
              }}
              keyboardType="numeric"
              editable={!isSwapping}
            />
          </View>

          {/* Swap Arrow */}
          <View className="items-center my-2">
            <Pressable
              onPress={handleSwapTokens}
              className="bg-violet-100 w-10 h-10 rounded-full items-center justify-center"
              disabled={isSwapping}
            >
              <Image source={swapArrows} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </Pressable>
          </View>

          {/* To Token */}
          <View
            className="bg-white rounded-2xl self-center relative"
            style={{
              width: '95%',
              paddingVertical: 5.12,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: '#9b9db5',
              justifyContent: 'center',
            }}
          >
            <View className="absolute left-4 flex-row items-center" style={{ top: '50%', marginTop: -15 }}>
              <Pressable
                onPress={() => setShowTokenPicker('to')}
                className="flex-row items-center gap-2"
              >
                {TOKEN_ICONS[toToken].isSvg ? (
                  <ExpoImage source={TOKEN_ICONS[toToken].source} style={{ width: 40, height: 40 }} contentFit="contain" />
                ) : (
                  <Image source={TOKEN_ICONS[toToken].source} style={{ width: 40, height: 40 }} resizeMode="contain" />
                )}
                <View className="ml-2">
                  <Text className="text-gray-900 font-bold">{toTokenInfo.name}</Text>
                  <Text className="text-gray-500 text-sm">
                    {isQuoteLoading ? '...' : toAmount || '0.00'} {toTokenInfo.symbol}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, marginLeft: 4 }}>▼</Text>
              </Pressable>
            </View>
            <TextInput
              style={{
                fontSize: 69.12,
                fontWeight: 'bold',
                textAlign: 'center',
                width: '100%',
                color: '#000000',
                backgroundColor: 'transparent',
              }}
              placeholder="0.00"
              placeholderTextColor="#A3A3A3"
              value={isQuoteLoading ? '...' : toAmount || '0.00'}
              editable={false}
            />
            {priceImpact > 0 && (
              <Text className="text-center text-xs mt-1" style={{ color: priceImpact > 1 ? '#ef4444' : '#6b7280' }}>
                Price impact: {priceImpact.toFixed(2)}%
              </Text>
            )}
            {quoteError && (
              <Text className="text-center text-xs mt-1 text-red-500">{quoteError}</Text>
            )}
          </View>

          {/* Swap Button */}
          <View className="items-center mt-6">
            <Button
              variant="primary"
              size="lg"
              style={{ paddingVertical: 10.752, borderRadius: 20.25, width: '75%' }}
              onPress={handleSwap}
              disabled={!quote || isSwapping || isQuoteLoading || !fromAmount || parseFloat(fromAmount) <= 0}
              loading={isSwapping}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 40.96 }}>Swap</Text>
            </Button>
          </View>
        </View>
      </View>

      {/* Token Picker Modal */}
      <Modal
        visible={showTokenPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTokenPicker(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setShowTokenPicker(null)} />
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '50%' }}>
            <Text className="text-xl font-bold mb-4">Select Token</Text>
            <ScrollView>
              {(Object.keys(TOKENS) as TokenSymbol[]).map((symbol) => {
                const token = TOKENS[symbol]
                const isDisabled =
                  (showTokenPicker === 'from' && symbol === toToken) ||
                  (showTokenPicker === 'to' && symbol === fromToken)
                return (
                  <Pressable
                    key={symbol}
                    onPress={() => handleTokenSelect(symbol)}
                    disabled={isDisabled}
                    className={`flex-row items-center p-4 rounded-xl mb-2 ${
                      isDisabled ? 'opacity-50' : 'bg-violet-50'
                    }`}
                  >
                    {TOKEN_ICONS[symbol].isSvg ? (
                      <ExpoImage source={TOKEN_ICONS[symbol].source} style={{ width: 40, height: 40 }} contentFit="contain" />
                    ) : (
                      <Image source={TOKEN_ICONS[symbol].source} style={{ width: 40, height: 40 }} />
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-lg">{token.name}</Text>
                      <Text className="text-gray-500">{symbol}</Text>
                    </View>
                    <Text className="text-gray-500">{getTokenBalance(symbol).toFixed(4)}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
