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
      <View className="px-5 pb-10 rounded-b-3xl min-h-[50vh]" style={{ paddingTop: insets.top + 32, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="flex-row items-center justify-between mb-24">
          <Text className="text-white text-4xl font-extrabold tracking-wide">
            B<Text className="text-violet-200">O</Text>NDUM
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <Text className="text-white text-xl">🔔</Text>
            </Pressable>
          </View>
        </View>

        {/* User Info */}
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-1">
            <Text className="text-violet-200 text-2xl font-extrabold">Status</Text>
            <Text className="text-white text-6xl font-extrabold">{user?.username || 'User'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/(profile)')}>
            <Avatar source={user?.avatarUrl} size="xl" />
          </Pressable>
        </View>

        {/* Balance */}
        <Text className="text-gray-900 text-4xl font-extrabold">{(user?.balance || 0).toLocaleString()} $BONDUM</Text>

        {/* NFT Collection Card */}
        <Pressable className="mt-9 mx-2">
          <Card className="flex-row items-center justify-between" padding="none" style={{ padding: 24 }}>
            <View className="flex-1">
              <Text className="text-lg leading-tight"><Text className="text-gray-400">View </Text><Text className="text-violet-500">collection</Text></Text>
              <Text className="text-gray-900 text-4xl font-extrabold leading-tight">You have {user?.nftCount || 0} NFT</Text>
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
              <View key={reward.id} className="mr-4 w-[80%] bg-gray-100 rounded-2xl p-4">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-violet-500 text-lg font-bold">Reward</Text>
                  <Badge variant="outline">{reward.available} available</Badge>
                </View>
                <Text className="text-gray-900 font-semibold mb-3">{reward.title}</Text>
                <View className="bg-red-600 rounded-xl py-6 items-center">
                  <Text className="text-white text-3xl font-extrabold">{reward.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-4" />
      </ScrollView>
    </View>
  )
}
