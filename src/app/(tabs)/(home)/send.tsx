import { View, Text, TextInput, Pressable, Image, Alert, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../../contexts/AuthContext'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { Button } from '../../../components/ui'
import { TransactionConfirmation } from '../../../components/TransactionConfirmation'
import { TOKENS, type TokenSymbol } from '../../../hooks/useSwapQuote'
import { buildTransferTransaction } from '../../../services/solana'
import { getTransactionDecoder } from '@solana/kit'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { useEmbeddedSolanaWallet } from '@privy-io/expo'
import { VersionedTransaction, Connection } from '@solana/web3.js'
import { Buffer } from 'buffer'
import { useQueryClient } from '@tanstack/react-query'

const bondumLogo = require('../../../assets/bondum_logo.png')

const TOKEN_LIST: { symbol: TokenSymbol; mint: string | null; decimals: number }[] = [
  { symbol: 'SOL', mint: null, decimals: 9 },
  { symbol: 'BONDUM', mint: TOKENS.BONDUM.mint, decimals: TOKENS.BONDUM.decimals },
  { symbol: 'USDC', mint: TOKENS.USDC.mint, decimals: TOKENS.USDC.decimals },
  { symbol: 'PANICAFE', mint: TOKENS.PANICAFE.mint, decimals: TOKENS.PANICAFE.decimals },
]

export default function SendScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { address, provider } = useAuth()
  const { tokens } = useTokenBalances()
  const queryClient = useQueryClient()
  const mobileWallet = useMobileWallet()
  const embeddedSolanaWallet = useEmbeddedSolanaWallet()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [completedTx, setCompletedTx] = useState<string | null>(null)

  const currentToken = TOKEN_LIST[selectedToken]
  const tokenBalance = tokens.find((t) => t.symbol === currentToken.symbol)?.balance || 0

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) setRecipient(text)
  }

  const handleMax = () => {
    setAmount(tokenBalance.toString())
  }

  const handleSend = async () => {
    if (!address) {
      Alert.alert('Error', 'Please connect a wallet first.')
      return
    }
    if (!recipient || recipient.length < 32) {
      Alert.alert('Error', 'Please enter a valid Solana address.')
      return
    }
    const sendAmount = parseFloat(amount)
    if (!sendAmount || sendAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.')
      return
    }
    if (sendAmount > tokenBalance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${currentToken.symbol}.`)
      return
    }

    setIsSending(true)
    try {
      const txBase64 = await buildTransferTransaction(
        address,
        recipient,
        currentToken.mint,
        sendAmount,
        currentToken.decimals,
      )

      const txBytes = Buffer.from(txBase64, 'base64')
      let signature: string

      if (provider === 'solana' && mobileWallet.account) {
        const decoder = getTransactionDecoder()
        const transaction = decoder.decode(txBytes)
        const signatures = await mobileWallet.signAndSendTransaction(transaction, BigInt(0))
        if (!signatures || signatures.length === 0) throw new Error('Wallet did not return a signature')
        const sigArray = Array.from(signatures[0] as Uint8Array)
        signature = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      } else if (provider === 'privy' && embeddedSolanaWallet.status === 'connected') {
        const transaction = VersionedTransaction.deserialize(txBytes)
        const RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
        const connection = new Connection(RPC_URL, 'confirmed')
        const privyProvider = await embeddedSolanaWallet.getProvider()
        const result = await privyProvider.request({
          method: 'signAndSendTransaction',
          params: { transaction, connection },
        })
        signature = result.signature
      } else {
        throw new Error('No wallet connected. Please reconnect your wallet.')
      }

      setAmount('')
      setRecipient('')
      setCompletedTx(signature)

      // Invalidate balance caches to trigger fresh refetch
      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
      queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
    } catch (error: any) {
      Alert.alert('Transfer Failed', error?.message || 'Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  if (completedTx) {
    return (
      <View className="flex-1 bg-violet-50">
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="flex-row items-center justify-between">
            <View className="w-10" />
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
            <View className="w-10" />
          </View>
        </View>
        <View className="flex-1 justify-center px-4">
          <View className="bg-white rounded-3xl">
            <TransactionConfirmation
              signature={completedTx}
              title="Transfer Sent!"
              message={`${amount || ''} ${currentToken.symbol} sent successfully.`}
              onDone={() => router.back()}
              simplified={provider === 'privy'}
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
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Text className="text-white text-3xl">{'\u2190'}</Text>
          </Pressable>
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" keyboardShouldPersistTaps="handled">
        <Text className="text-center mb-6">
          <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>SEND </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 36 }}>TOKENS</Text>
        </Text>

        {/* Recipient */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">RECIPIENT ADDRESS</Text>
        <View className="bg-white rounded-2xl px-4 py-3 mb-4 flex-row items-center" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Solana address..."
            placeholderTextColor="#A3A3A3"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={handlePaste} className="ml-2 bg-violet-100 rounded-lg px-3 py-1">
            <Text className="text-violet-600 font-semibold text-sm">Paste</Text>
          </Pressable>
        </View>

        {/* Token Selector */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">TOKEN</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {TOKEN_LIST.map((token, index) => (
            <Pressable
              key={token.symbol}
              onPress={() => setSelectedToken(index)}
              className={`rounded-xl px-4 py-2 mr-2 ${index === selectedToken ? 'bg-violet-500' : 'bg-white'}`}
              style={{ borderWidth: 1, borderColor: index === selectedToken ? '#8B5CF6' : '#9b9db5' }}
            >
              <Text className={`font-bold ${index === selectedToken ? 'text-white' : 'text-gray-900'}`}>
                {token.symbol}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Amount */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">AMOUNT</Text>
        <View className="bg-white rounded-2xl px-4 py-3 mb-2 flex-row items-center" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
          <TextInput
            className="flex-1 text-gray-900 font-bold"
            style={{ fontSize: 32 }}
            placeholder="0"
            placeholderTextColor="#A3A3A3"
            value={amount}
            onChangeText={(text) => {
              const formatted = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
              setAmount(formatted)
            }}
            keyboardType="numeric"
          />
          <Pressable onPress={handleMax} className="ml-2 bg-violet-100 rounded-lg px-3 py-1">
            <Text className="text-violet-600 font-semibold text-sm">MAX</Text>
          </Pressable>
        </View>
        <Text className="text-gray-400 text-sm mb-6">
          Balance: {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currentToken.symbol}
        </Text>

        {/* Send Button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSend}
          loading={isSending}
          disabled={!recipient || !amount || parseFloat(amount) <= 0 || isSending}
          style={{ paddingVertical: 14, borderRadius: 20 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 32 }}>Send {currentToken.symbol}</Text>
        </Button>
      </ScrollView>
    </View>
  )
}
