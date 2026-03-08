import { View, Text, Pressable, Linking } from 'react-native'
import { useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import { Button } from './ui'

interface TransactionConfirmationProps {
  signature: string
  title?: string
  message?: string
  onDone: () => void
  onScanAnother?: () => void
}

const EXPLORER_BASE = 'https://orb.helius.dev/tx'

/**
 * Returns true if the signature looks like a real on-chain transaction
 * (base58, 64+ chars). Fake signatures like "redemption-..." are filtered out.
 */
function isOnChainSignature(sig: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{64,}$/.test(sig)
}

export function TransactionConfirmation({
  signature,
  title = 'Transaction Confirmed!',
  message,
  onDone,
  onScanAnother,
}: TransactionConfirmationProps) {
  const [copiedSig, setCopiedSig] = useState(false)
  const isRealTx = isOnChainSignature(signature)
  const truncatedSig = `${signature.slice(0, 12)}...${signature.slice(-8)}`

  const openExplorer = () => {
    Linking.openURL(`${EXPLORER_BASE}/${signature}`)
  }

  const copySignature = async () => {
    await Clipboard.setStringAsync(signature)
    setCopiedSig(true)
    setTimeout(() => setCopiedSig(false), 2000)
  }

  return (
    <View className="items-center py-8 px-6">
      <Text className="text-green-500 mb-4" style={{ fontSize: 80 }}>
        {'\u2713'}
      </Text>
      <Text className="text-gray-900 font-bold mb-2 text-center" style={{ fontSize: 28 }}>
        {title}
      </Text>
      {message && (
        <Text className="text-gray-500 text-center mb-4" style={{ fontSize: 16 }}>
          {message}
        </Text>
      )}

      {isRealTx && (
        <Pressable onPress={copySignature} className="w-full mb-4">
          <View className="bg-gray-100 rounded-xl px-4 py-3 w-full">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-gray-400 text-xs">Transaction Signature</Text>
              <Text className="text-violet-500 text-xs font-semibold">{copiedSig ? 'Copied!' : 'Tap to copy'}</Text>
            </View>
            <Text className="text-gray-700 font-mono text-sm">{truncatedSig}</Text>
          </View>
        </Pressable>
      )}

      {isRealTx && (
        <Pressable onPress={openExplorer} className="mb-6">
          <Text className="text-violet-500 font-semibold">View on Orb {'>'}</Text>
        </Pressable>
      )}

      <View className="flex-row gap-3">
        {onScanAnother && (
          <Button variant="outline" onPress={onScanAnother}>
            <Text style={{ fontSize: 18 }}>Scan Another</Text>
          </Button>
        )}
        <Button variant="primary" onPress={onDone}>
          <Text style={{ fontSize: 18, color: '#FFFFFF' }}>Done</Text>
        </Button>
      </View>
    </View>
  )
}
