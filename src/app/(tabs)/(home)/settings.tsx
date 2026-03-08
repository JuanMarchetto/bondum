import { View, Text, Pressable, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../contexts/AuthContext'
import { useSeekerDevice } from '../../../hooks/useSeekerDevice'
import { useStreak } from '../../../hooks/useStreak'
import { useLanguage } from '../../../contexts/LanguageContext'
import * as Clipboard from 'expo-clipboard'
import { Button } from '../../../components/ui'

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, address, provider, disconnect, isLoading } = useAuth()
  const { isSeeker, hasSeedVault } = useSeekerDevice()
  const { currentStreak, totalScans, multiplier } = useStreak()
  const { t, language, setLanguage } = useLanguage()

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address)
      Alert.alert(t('common.copied'), t('settings.copiedAddress'))
    }
  }

  const handleLogout = () => {
    Alert.alert(t('settings.logOut'), t('settings.logOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logOut'),
        style: 'destructive',
        onPress: async () => {
          try {
            await disconnect()
          } catch {
            Alert.alert(t('common.error'), t('settings.logOutFailed'))
          }
        },
      },
    ])
  }

  const handleLanguageChange = () => {
    Alert.alert(t('settings.selectLanguage'), '', [
      {
        text: 'English',
        onPress: () => setLanguage('en'),
      },
      {
        text: 'Espa\u00f1ol',
        onPress: () => setLanguage('es'),
      },
      { text: t('common.cancel'), style: 'cancel' },
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
            <Text className="text-white text-3xl">{'\u2190'}</Text>
          </Pressable>
          <Text className="text-white font-bold text-xl">{t('settings.title')}</Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 px-5 pt-6">
        {/* User Info Section */}
        <View className="bg-gray-100 rounded-2xl p-4 mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Text className="text-gray-500 text-sm mb-1">{t('settings.account')}</Text>
          <Text className="text-gray-900 font-bold text-lg">{user?.username || 'User'}</Text>
          {address && provider !== 'privy' && (
            <Pressable onPress={handleCopyAddress} className="mt-2">
              <Text className="text-gray-500 text-sm mb-1">{t('settings.walletAddress')}</Text>
              <Text className="text-violet-500 text-sm" numberOfLines={1}>
                {address.slice(0, 8)}...{address.slice(-8)}
              </Text>
              <Text className="text-gray-400 text-xs mt-1">{t('settings.tapToCopy')}</Text>
            </Pressable>
          )}
        </View>

        {/* Wallet & Device Info */}
        <View className="bg-gray-100 rounded-2xl p-4 mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Text className="text-gray-500 text-sm mb-2">{t('settings.connection')}</Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 text-sm">{t('settings.signInMethod')}</Text>
            <Text className="text-violet-500 text-sm font-bold">{provider === 'solana' ? t('settings.mobileWallet') : provider === 'privy' ? t('settings.email') : t('settings.guest')}</Text>
          </View>
          {isSeeker && (
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-900 text-sm">{t('settings.device')}</Text>
              <Text className="text-green-600 text-sm font-bold">{t('settings.solanaSeeker')}</Text>
            </View>
          )}
          {hasSeedVault && (
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 text-sm">{t('settings.seedVault')}</Text>
              <Text className="text-green-600 text-sm font-bold">{t('settings.active')}</Text>
            </View>
          )}
        </View>

        {/* Streak Stats */}
        <View className="bg-gray-100 rounded-2xl p-4 mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Text className="text-gray-500 text-sm mb-2">{t('settings.streakStats')}</Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 text-sm">{t('settings.currentStreak')}</Text>
            <Text className="text-violet-500 text-sm font-bold">{t('settings.days', { count: currentStreak })}</Text>
          </View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 text-sm">{t('settings.multiplier')}</Text>
            <Text className="text-violet-500 text-sm font-bold">{multiplier.toFixed(1)}x</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-900 text-sm">{t('settings.totalScans')}</Text>
            <Text className="text-gray-900 text-sm font-bold">{totalScans}</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View className="bg-gray-100 rounded-2xl mb-6" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Pressable onPress={handleLanguageChange} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
            <Text className="text-gray-900 text-base">{t('settings.language')}</Text>
            <View className="flex-row items-center">
              <Text className="text-violet-500 text-sm font-bold mr-2">{language === 'es' ? t('settings.languageSpanish') : t('settings.languageEnglish')}</Text>
              <Text className="text-gray-400 text-lg">{'\u203A'}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => Alert.alert(t('settings.notifications'), t('settings.notificationsMessage'))} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
            <Text className="text-gray-900 text-base">{t('settings.notifications')}</Text>
            <Text className="text-gray-400 text-lg">{'\u203A'}</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert(t('settings.security'), hasSeedVault ? t('settings.securitySeedVault') : t('settings.securityProvider'))} className="flex-row items-center justify-between p-4" style={{ borderBottomWidth: 1, borderBottomColor: '#E5E5E5' }}>
            <Text className="text-gray-900 text-base">{t('settings.security')}</Text>
            <Text className="text-gray-400 text-lg">{'\u203A'}</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert(t('settings.aboutTitle'), t('settings.aboutMessage'))} className="flex-row items-center justify-between p-4">
            <Text className="text-gray-900 text-base">{t('settings.about')}</Text>
            <Text className="text-gray-400 text-lg">{'\u203A'}</Text>
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
          <Text style={{ fontSize: 30, color: '#FFFFFF' }}>{t('settings.logOut')}</Text>
        </Button>
      </View>
    </View>
  )
}
