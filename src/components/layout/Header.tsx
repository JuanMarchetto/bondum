import { View, Text, Pressable, Image } from 'react-native'
import { Avatar } from '../ui/Avatar'
import { BellIcon } from '../ui/BellIcon'
import type { ReactNode } from 'react'

const avatarImage = undefined
const bondumLogo = require('../../assets/bondum_logo.png')

interface HeaderProps {
  userName?: string
  balance?: string
  avatarUrl?: string | null
  onNotificationPress?: () => void
  onAvatarPress?: () => void
  rightContent?: ReactNode
}

export function Header({
  userName = 'User',
  balance = '0',
  avatarUrl,
  onNotificationPress,
  onAvatarPress,
  rightContent,
}: HeaderProps) {
  return (
    <View className="px-5 pt-12 pb-6" style={{ backgroundColor: '#8b66df' }}>
      {/* Logo */}
      <View className="items-center mb-4">
        <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
      </View>

      {/* User Info Row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold" style={{ fontSize: 24 }}>Hello, {userName}!</Text>
          <Text className="text-violet-200" style={{ fontSize: 19 }}>{balance} $BONDUM</Text>
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
    </View>
  )
}
