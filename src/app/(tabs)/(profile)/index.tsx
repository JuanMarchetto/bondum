import { View, Text, Pressable, useWindowDimensions, Image, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../../contexts/AuthContext'
import { useBondumBalance } from '../../../hooks/useBondumBalance'
import { useTokenBalances } from '../../../hooks/useTokenBalances'
import { Avatar, BellIcon } from '../../../components/ui'
import { useLanguage } from '../../../contexts/LanguageContext'

const avatarImage = undefined
const bondumLogo = require('../../../assets/bondum_logo.png')
const bLogo = require('../../../assets/b-logo.png')
const usdcLogo = require('../../../assets/usdc-logo.png')

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, address, provider } = useAuth()
  const { balance: bondumBalance, isLoading: isBalanceLoading } = useBondumBalance()
  const { tokens, isLoading: isTokensLoading } = useTokenBalances()
  const { width } = useWindowDimensions()
  const avatarSize = Math.round(width * 0.24)
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : t('profile.noWallet')

  const handleCopyAddress = async () => {
    if (!address) return
    await Clipboard.setStringAsync(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header — same as Home */}
      <View className="px-5 pb-2.5 rounded-b-3xl" style={{ paddingTop: insets.top + 32, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="flex-row items-center justify-between" style={{ marginBottom: 36 }}>
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
          </View>
        </View>

        {/* User Info + Avatar */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-white text-6xl font-extrabold" numberOfLines={1}>{(user?.username || 'User').length > 16 ? (user?.username || 'User').slice(0, 16) + '...' : user?.username || 'User'}</Text>
          </View>
          <Avatar source={avatarImage} size="custom" customSize={avatarSize} style={{ borderWidth: 6, borderColor: 'white' }} />
        </View>

        {/* Balance */}
        <View className="flex-row items-center gap-3 mb-2">
          <Image source={bLogo} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
          <Text className="text-white font-extrabold" style={{ fontSize: 27 }}>
            {isBalanceLoading ? '...' : bondumBalance.toLocaleString()} $BONDUM
          </Text>
        </View>

        <View className="flex-row items-center gap-3">
          <Image source={usdcLogo} style={{ width: 24, height: 24, resizeMode: 'contain' }} />
          <Text className="text-white font-extrabold" style={{ fontSize: 27 }}>
            {isTokensLoading ? '...' : (tokens.find(tk => tk.symbol === 'USDC')?.balance || 0).toLocaleString()} USDC
          </Text>
        </View>
      </View>

      {/* White content area */}
      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Wallet Address — visible for all users */}
        <Text className="text-gray-500 text-sm font-semibold mb-2">{t('profile.walletAddress')}</Text>
        <Pressable
          onPress={handleCopyAddress}
          className="bg-gray-100 rounded-2xl flex-row items-center justify-between"
          style={{ padding: 18, borderWidth: 1, borderColor: '#E5E5E5' }}
        >
          <View className="flex-1 mr-3">
            <Text className="text-gray-900 font-bold text-lg mb-1">{truncatedAddress}</Text>
            <Text className="text-gray-400 text-xs" numberOfLines={1} ellipsizeMode="middle">
              {address || ''}
            </Text>
          </View>
          <View className="bg-violet-500 rounded-xl items-center justify-center" style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
            <Text className="text-white font-bold text-sm">{copied ? t('common.copied') : t('common.copy')}</Text>
          </View>
        </Pressable>

        {/* Wallet Recovery / Security */}
        <Text className="text-gray-500 text-sm font-semibold mb-2 mt-6">{t('profile.walletSecurity')}</Text>
        {provider === 'privy' ? (
          <View className="bg-green-50 rounded-2xl" style={{ padding: 18, borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text className="text-green-700 font-bold text-lg mb-2">{t('profile.embeddedWallet')}</Text>
            <Text className="text-green-600 text-sm mb-3">
              {t('profile.embeddedWalletDesc')}
            </Text>
            <View className="bg-white rounded-xl" style={{ padding: 14, borderWidth: 1, borderColor: '#d1fae5' }}>
              <Text className="text-gray-700 text-sm font-semibold mb-1">{t('profile.recoveryMethod')}</Text>
              <Text className="text-gray-500 text-sm">{t('profile.recoveryDesc', { email: user?.username || '' })}</Text>
            </View>
          </View>
        ) : provider === 'solana' ? (
          <View className="bg-amber-50 rounded-2xl" style={{ padding: 18, borderWidth: 1, borderColor: '#fde68a' }}>
            <Text className="text-amber-700 font-bold text-lg mb-2">{t('profile.externalWallet')}</Text>
            <Text className="text-amber-600 text-sm mb-3">
              {t('profile.externalWalletDesc')}
            </Text>
            <View className="bg-white rounded-xl" style={{ padding: 14, borderWidth: 1, borderColor: '#fef3c7' }}>
              <Text className="text-gray-700 text-sm font-semibold mb-1">{t('profile.seedPhraseRecovery')}</Text>
              <Text className="text-gray-500 text-sm">
                {t('profile.seedPhraseDesc')}
              </Text>
            </View>
          </View>
        ) : (
          <View className="bg-gray-100 rounded-2xl" style={{ padding: 18, borderWidth: 1, borderColor: '#E5E5E5' }}>
            <Text className="text-gray-700 font-bold text-lg mb-1">{t('profile.guestMode')}</Text>
            <Text className="text-gray-500 text-sm">{t('profile.guestModeDesc')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
