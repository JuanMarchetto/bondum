import { View, Text, Pressable, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Avatar } from '../ui/Avatar'
import { BellIcon } from '../ui/BellIcon'
import { ChevronBack } from '../ui/ChevronBack'
import type { ReactNode } from 'react'
import { fontSize } from '../../constants/typography'
import { colors } from '../../constants'
import { useLanguage } from '../../contexts/LanguageContext'

const avatarImage = undefined
const bondumLogo = require('../../assets/bondum_logo.png')

interface HeaderProps {
  userName?: string
  avatarUrl?: string | null
  onNotificationPress?: () => void
  onAvatarPress?: () => void
  rightContent?: ReactNode
  showBackButton?: boolean
  children?: ReactNode
}

export function Header({
  userName = 'User',
  avatarUrl,
  onNotificationPress,
  onAvatarPress,
  rightContent,
  showBackButton = false,
  children,
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <View className="px-5 pb-4 rounded-b-3xl" style={{ paddingTop: insets.top + 8, backgroundColor: colors.background.header }}>
      {showBackButton ? (
        <View className="flex-row items-center mb-4 relative">
          <Pressable onPress={() => router.back()} className="mr-4" hitSlop={12}>
            <ChevronBack size={28} color="white" />
          </Pressable>
          <View className="absolute left-0 right-0 items-center">
            <Image source={bondumLogo} style={{ width: 100, height: 44, resizeMode: 'contain' }} />
          </View>
        </View>
      ) : (
        <View className="items-center mb-4">
          <Image source={bondumLogo} style={{ width: 100, height: 44, resizeMode: 'contain' }} />
        </View>
      )}

      {/* User Info Row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold" style={{ fontSize: fontSize['2xl'] }} numberOfLines={1}>{t('header.hello', { name: userName.length > 18 ? userName.slice(0, 18) + '...' : userName })}</Text>
        </View>

        <View className="flex-row items-center gap-3">
          {rightContent}
          <Pressable onPress={onNotificationPress} className="p-2" hitSlop={12}>
            <BellIcon size={32} color="white" />
          </Pressable>
          <Pressable onPress={onAvatarPress}>
            <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
          </Pressable>
        </View>
      </View>

      {children}
    </View>
  )
}
