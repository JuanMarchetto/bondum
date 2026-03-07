import { View, Text, Pressable, Alert, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/AuthContext'
import * as Clipboard from 'expo-clipboard'
import { Button } from '../../../components/ui'

const bondumLogo = require('../../../assets/bondum_logo.png')

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, address, disconnect, isLoading } = useAuth()

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address)
      Alert.alert('Copied', 'Wallet address copied to clipboard')
    }
  }

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnect()
          } catch (error) {
            console.error('Logout error:', error)
            Alert.alert('Error', 'Failed to log out. Please try again.')
          }
        },
      },
    ])
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View
        className="px-5 pb-6 rounded-b-3xl"
        style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Text className="text-white text-3xl">←</Text>
          </Pressable>
          <Text className="text-white font-bold text-xl">Settings</Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 px-5 pt-6">
        {/* User Info Section */}
        <View className="bg-gray-100 rounded-2xl p-4 mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Text className="text-gray-500 text-sm mb-1">Account</Text>
          <Text className="text-gray-900 font-bold text-lg">{user?.username || 'User'}</Text>
          {address && (
            <Pressable onPress={handleCopyAddress} className="mt-2">
              <Text className="text-gray-500 text-sm mb-1">Wallet Address</Text>
              <Text className="text-violet-500 text-sm" numberOfLines={1}>
                {address.slice(0, 8)}...{address.slice(-8)}
              </Text>
              <Text className="text-gray-400 text-xs mt-1">Tap to copy</Text>
            </Pressable>
          )}
        </View>

        {/* Settings Options */}
        <View className="bg-gray-100 rounded-2xl mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Pressable onPress={() => Alert.alert('Notifications', 'Push notifications coming in the next update.')} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
            <Text className="text-gray-900 text-base">Notifications</Text>
            <Text className="text-gray-400 text-lg">›</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Security', 'Biometric authentication and Seed Vault integration coming soon.')} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
            <Text className="text-gray-900 text-base">Security</Text>
            <Text className="text-gray-400 text-lg">›</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('About Bondum', 'Version 1.0.0\n\nBondum - On-Chain Loyalty Wallet\nbondum.xyz')} className="flex-row items-center justify-between p-4">
            <Text className="text-gray-900 text-base">About</Text>
            <Text className="text-gray-400 text-lg">›</Text>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onPress={handleLogout}
          loading={isLoading}
          style={{ paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 32.4, color: '#FFFFFF' }}>Log Out</Text>
        </Button>
      </View>
    </View>
  )
}

