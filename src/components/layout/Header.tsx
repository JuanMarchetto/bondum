import { View, Text, Pressable } from 'react-native'
import { Avatar } from '../ui/Avatar'
import type { ReactNode } from 'react'

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
        <Text className="text-white text-2xl font-extrabold tracking-wide">
          B<Text className="text-violet-200">O</Text>NDUM
        </Text>
      </View>

      {/* User Info Row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white text-lg font-bold">Hello, {userName}!</Text>
          <Text className="text-violet-200">~ {balance} $BONDUM</Text>
        </View>

        <View className="flex-row items-center gap-3">
          {rightContent}
          <Pressable onPress={onNotificationPress} className="p-2">
            <View className="w-6 h-6 items-center justify-center">
              <Text className="text-white text-lg">🔔</Text>
            </View>
          </Pressable>
          <Pressable onPress={onAvatarPress}>
            <Avatar source={avatarUrl} size="lg" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}
