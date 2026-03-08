import { View, Text, Pressable, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Avatar } from '../ui/Avatar'
import { BellIcon } from '../ui/BellIcon'
import type { ReactNode } from 'react'
import { fontSize } from '../../constants/typography'

const avatarImage = undefined
const bondumLogo = require('../../assets/bondum_logo.png')

interface HeaderProps {
  userName?: string
  balance?: string
  avatarUrl?: string | null
  onNotificationPress?: () => void
  onAvatarPress?: () => void
  rightContent?: ReactNode
  showBackButton?: boolean
  children?: ReactNode
}

export function Header({
  userName = 'User',
  balance = '0',
  avatarUrl,
  onNotificationPress,
  onAvatarPress,
  rightContent,
  showBackButton = false,
  children,
}: HeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
      {showBackButton ? (
        <View className="flex-row items-center mb-4 relative">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-white" style={{ fontSize: fontSize['5xl'] }}>←</Text>
          </Pressable>
          <View className="absolute left-0 right-0 items-center">
            <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          </View>
        </View>
      ) : (
        <View className="items-center mb-4">
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>
      )}

      {/* User Info Row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold" style={{ fontSize: fontSize['2xl'] }}>Hello, {userName}!</Text>
          <Text className="text-violet-200" style={{ fontSize: fontSize.lg }}>{balance} $BONDUM</Text>
        </View>

        <View className="flex-row items-center gap-3">
          {rightContent}
          <Pressable onPress={onNotificationPress} className="p-2">
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
