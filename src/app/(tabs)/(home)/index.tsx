import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Badge, Avatar, IconButton } from '../../../components/ui'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()

  const quickActions = [
    { icon: '📱', label: 'Scan', onPress: () => router.push('/scan') },
    { icon: '📤', label: 'Send', onPress: () => {} },
    { icon: '🎁', label: 'Boxes', onPress: () => router.push('/(tabs)/(rewards)') },
    { icon: '⚙️', label: 'Settings', onPress: () => {} },
  ]

  // Mock rewards data
  const rewards = [
    { id: '1', title: '40% discount on your next purchase', value: '40% OFF', available: 3 },
    { id: '2', title: 'Free shipping on orders over $50', value: 'FREE', available: 1 },
  ]

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="bg-violet-500 px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16 }}>
        {/* Logo */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-extrabold tracking-wide">
            B<Text className="text-violet-200">O</Text>NDUM
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <Text className="text-white text-xl">🔔</Text>
            </Pressable>
          </View>
        </View>

        {/* User Info */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-violet-200 text-sm">Status</Text>
            <Text className="text-white text-3xl font-extrabold">{user?.username || 'User'}</Text>
            <Text className="text-white text-lg font-bold">{(user?.balance || 0).toLocaleString()} $BONDUM</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/(profile)')}>
            <Avatar source={user?.avatarUrl} size="xl" />
          </Pressable>
        </View>

        {/* NFT Collection Card */}
        <Pressable className="mt-4">
          <Card className="flex-row items-center justify-between">
            <View>
              <Text className="text-violet-500 text-sm">View collection</Text>
              <Text className="text-gray-900 text-lg font-bold">You have {user?.nftCount || 0} NFT</Text>
            </View>
            <View className="flex-row">
              <View className="w-12 h-12 rounded-lg bg-violet-200 -mr-2" />
              <View className="w-12 h-12 rounded-lg bg-pink-200 -mr-2" />
              <View className="w-12 h-12 rounded-lg bg-orange-200" />
            </View>
          </Card>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View className="flex-row justify-around mb-6">
          {quickActions.map((action) => (
            <IconButton
              key={action.label}
              icon={<Text className="text-2xl">{action.icon}</Text>}
              label={action.label}
              onPress={action.onPress}
            />
          ))}
        </View>

        {/* Rewards Section */}
        <View className="mb-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">Available Rewards</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className="mr-4 w-72">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-violet-500 font-medium">Reward</Text>
                  <Badge variant="outline">{reward.available} available</Badge>
                </View>
                <Text className="text-gray-900 font-semibold mb-3">{reward.title}</Text>
                <View className="bg-red-600 rounded-xl py-6 items-center">
                  <Text className="text-white text-3xl font-extrabold">{reward.value}</Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  )
}
