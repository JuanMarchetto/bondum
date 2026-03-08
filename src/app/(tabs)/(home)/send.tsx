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
import { useLanguage } from '../../../contexts/LanguageContext'

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
  const { t } = useLanguage()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [completedTx, setCompletedTx] = useState<string | null>(null)
  const [sentAmount, setSentAmount] = useState('')

  const currentToken = TOKEN_LIST[selectedToken]
  const tokenBalance = tokens.find((tk) => tk.symbol === currentToken.symbol)?.balance || 0

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) setRecipient(text)
  }

  const handleMax = () => {
    setAmount(tokenBalance.toString())
  }

  const handleSend = async () => {
    if (!address) {
      Alert.alert(t('common.error'), t('send.connectWallet'))
      return
    }
    if (!recipient || recipient.length < 32) {
      Alert.alert(t('common.error'), t('send.invalidAddress'))
      return
    }
    const sendAmount = parseFloat(amount)
    if (!sendAmount || sendAmount <= 0) {
      Alert.alert(t('common.error'), t('send.invalidAmount'))
      return
    }
    if (sendAmount > tokenBalance) {
      Alert.alert(t('send.insufficientBalance'), t('send.notEnoughToken', { symbol: currentToken.symbol }))
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
        throw new Error(t('send.noWallet'))
      }

      setSentAmount(amount)
      setAmount('')
      setRecipient('')
      setCompletedTx(signature)

      queryClient.invalidateQueries({ queryKey: ['tokenBalances'] })
      queryClient.invalidateQueries({ queryKey: ['bondumBalance'] })
    } catch (error: any) {
      Alert.alert(t('send.transferFailed'), error?.message || t('send.transferFailed'))
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
              title={t('send.transferSent')}
              message={t('send.transferMessage', { amount: sentAmount, symbol: currentToken.symbol })}
              onDone={() => router.back()}
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
          <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>{t('send.title')} </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 36 }}>{t('send.titleSuffix')}</Text>
        </Text>

        {/* Recipient */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">{t('send.recipientAddress')}</Text>
        <View className="bg-white rounded-2xl px-4 py-3 mb-4 flex-row items-center" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder={t('send.addressPlaceholder')}
            placeholderTextColor="#A3A3A3"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable onPress={handlePaste} className="ml-2 bg-violet-100 rounded-lg px-3 py-1">
            <Text className="text-violet-600 font-semibold text-sm">{t('send.paste')}</Text>
          </Pressable>
        </View>

        {/* Token Selector */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">{t('send.token')}</Text>
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
        <Text className="text-gray-500 text-sm font-semibold mb-2">{t('send.amount')}</Text>
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
            <Text className="text-violet-600 font-semibold text-sm">{t('send.max')}</Text>
          </Pressable>
        </View>
        <Text className="text-gray-400 text-sm mb-6">
          {t('send.balanceDisplay', { amount: tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 }), symbol: currentToken.symbol })}
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
          <Text style={{ color: '#FFFFFF', fontSize: 32 }}>{t('send.sendToken', { symbol: currentToken.symbol })}</Text>
        </Button>
      </ScrollView>
    </View>
  )
}
