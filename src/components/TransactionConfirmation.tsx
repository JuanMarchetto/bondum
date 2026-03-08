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
  const truncatedSig = `${signature.slice(0, 14)}...${signature.slice(-6)}`

  const openExplorer = () => {
    Linking.openURL(`${EXPLORER_BASE}/${signature}`)
  }

  const copySignature = async () => {
    await Clipboard.setStringAsync(signature)
    setCopiedSig(true)
    setTimeout(() => setCopiedSig(false), 2000)
  }

  return (
    <View className="items-center px-4" style={{ paddingVertical: 24 }}>
      {/* Success icon */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: '#ecfdf5',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 40, color: '#10b981' }}>{'\u2713'}</Text>
      </View>

      {/* Title */}
      <Text className="text-gray-900 font-bold mb-1 text-center" style={{ fontSize: 24 }}>
        {title}
      </Text>

      {/* Message */}
      {message && (
        <Text className="text-gray-500 text-center" style={{ fontSize: 15, marginBottom: 20 }}>
          {message}
        </Text>
      )}

      {/* Transaction signature card */}
      {isRealTx && (
        <Pressable onPress={copySignature} className="w-full" style={{ marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text className="text-gray-400" style={{ fontSize: 11, marginBottom: 4 }}>
              Transaction Signature
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700" style={{ fontSize: 13, fontFamily: 'monospace', flex: 1 }}>
                {truncatedSig}
              </Text>
              <View
                style={{
                  backgroundColor: copiedSig ? '#ecfdf5' : '#ede9fe',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: copiedSig ? '#10b981' : '#7c3aed',
                  }}
                >
                  {copiedSig ? 'Copied!' : 'Copy'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      )}

      {/* Explorer link */}
      {isRealTx && (
        <Pressable onPress={openExplorer} style={{ marginBottom: 20, paddingVertical: 6 }}>
          <Text style={{ color: '#7c3aed', fontWeight: '600', fontSize: 14 }}>
            View on Orb Explorer {'\u2192'}
          </Text>
        </Pressable>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-3" style={{ width: '100%' }}>
        {onScanAnother && (
          <View style={{ flex: 1 }}>
            <Button variant="outline" onPress={onScanAnother} style={{ width: '100%', minHeight: 48 }}>
              <Text style={{ fontSize: 16 }}>Scan Another</Text>
            </Button>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Button variant="primary" onPress={onDone} style={{ width: '100%', minHeight: 48 }}>
            <Text style={{ fontSize: 16, color: '#FFFFFF' }}>Done</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
