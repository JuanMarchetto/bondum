import { View, Text, Pressable, Linking } from 'react-native'
import { Button } from './ui'

interface TransactionConfirmationProps {
  signature: string
  title?: string
  message?: string
  onDone: () => void
  onScanAnother?: () => void
}

const SOLSCAN_BASE = 'https://solscan.io/tx'

export function TransactionConfirmation({
  signature,
  title = 'Transaction Confirmed!',
  message,
  onDone,
  onScanAnother,
}: TransactionConfirmationProps) {
  const truncatedSig = `${signature.slice(0, 12)}...${signature.slice(-8)}`

  const openSolscan = () => {
    Linking.openURL(`${SOLSCAN_BASE}/${signature}`)
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

      <View className="bg-gray-100 rounded-xl px-4 py-3 mb-4 w-full">
        <Text className="text-gray-400 text-xs mb-1">Transaction Signature</Text>
        <Text className="text-gray-700 font-mono text-sm">{truncatedSig}</Text>
      </View>

      <Pressable onPress={openSolscan} className="mb-6">
        <Text className="text-violet-500 font-semibold">View on Solscan {'>'}</Text>
      </Pressable>

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
