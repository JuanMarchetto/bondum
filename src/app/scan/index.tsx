import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar, Button, Card, BellIcon } from '../../components/ui'

const avatarImage = require('../../assets/avatar.png')

export default function ScanScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    setScanResult(data)
  }

  if (!permission) {
    return (
      <View className="flex-1 bg-violet-50 items-center justify-center">
        <Text className="text-gray-500">Requesting camera permission...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-violet-50">
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-4">
              <Text className="text-white text-2xl">←</Text>
            </Pressable>
            <Text className="text-white text-4xl font-extrabold tracking-wide flex-1 text-center mr-8">
              B<Text className="text-violet-200">O</Text>NDUM
            </Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-900 text-xl font-bold text-center mb-4">Camera Permission Required</Text>
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

  if (scanResult) {
    return (
      <View className="flex-1 bg-violet-50">
        <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
          <View className="flex-row items-center mb-4">
            <Pressable onPress={() => router.back()} className="mr-4">
              <Text className="text-white text-2xl">←</Text>
            </Pressable>
            <Text className="text-white text-4xl font-extrabold tracking-wide flex-1 text-center mr-8">
              B<Text className="text-violet-200">O</Text>NDUM
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-lg font-bold">Hello, {user?.username || 'User'}!</Text>
              <Text className="text-violet-200">~ {(user?.balance || 0).toLocaleString()} $BONDUM</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable className="p-2">
                <BellIcon size={32} color="white" />
              </Pressable>
              <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
            </View>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Card className="w-full items-center py-8" padding="lg">
            <Text className="text-green-500 text-6xl mb-4">✓</Text>
            <Text className="text-gray-900 text-xl font-bold mb-2">Code Scanned!</Text>
            <Text className="text-gray-500 text-center mb-6">
              You&apos;ve successfully scanned a Bondum product code.
            </Text>
            <View className="flex-row gap-4">
              <Button
                variant="outline"
                onPress={() => {
                  setScanned(false)
                  setScanResult(null)
                }}
              >
                Scan Another
              </Button>
              <Button variant="primary" onPress={() => router.replace('/(tabs)/(rewards)')}>
                View Rewards
              </Button>
            </View>
          </Card>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl z-10" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        <View className="flex-row items-center mb-4">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-white text-2xl">←</Text>
          </Pressable>
          <Text className="text-white text-4xl font-extrabold tracking-wide flex-1 text-center mr-8">
            B<Text className="text-violet-200">O</Text>NDUM
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">Hello, {user?.username || 'User'}!</Text>
            <Text className="text-violet-200">~ {(user?.balance || 0).toLocaleString()} $BONDUM</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
            <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
          </View>
        </View>
      </View>

      {/* Scanner Area */}
      <View className="flex-1 px-4 pt-6">
        <Card padding="lg" className="flex-1">
          <Text className="text-center mb-4">
            <Text className="text-violet-500 text-xl font-bold italic">SCAN </Text>
            <Text className="text-gray-900 text-xl font-extrabold">YOUR CODE</Text>
          </Text>

          <View className="flex-1 rounded-2xl overflow-hidden bg-gray-100 relative">
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
                {/* Corner brackets */}
                <View className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-violet-500 rounded-tl-lg" />
                <View className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-violet-500 rounded-tr-lg" />
                <View className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-violet-500 rounded-bl-lg" />
                <View className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-violet-500 rounded-br-lg" />
              </View>
            </View>
          </View>

          <Text className="text-gray-500 text-center mt-4 text-sm">
            Each scanned product brings you closer to amazing rewards: experiences, exclusive discounts, NFTs, and more.
          </Text>
        </Card>
      </View>

      <View style={{ paddingBottom: insets.bottom + 16 }} />
    </View>
  )
}
