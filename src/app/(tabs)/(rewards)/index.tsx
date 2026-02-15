import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Badge, Avatar } from '../../../components/ui'

interface Reward {
  id: string
  type: 'discount' | 'token' | 'nft'
  title: string
  value: string
  cost: number
  available: number
}

const mockRewards: Reward[] = [
  {
    id: '1',
    type: 'discount',
    title: '40% discount on your next purchase',
    value: '40% OFF',
    cost: 5000,
    available: 3,
  },
  {
    id: '2',
    type: 'discount',
    title: '15% discount on your next purchase of the product',
    value: '15% OFF',
    cost: 10000,
    available: 3,
  },
  {
    id: '3',
    type: 'token',
    title: 'Bonus $BONDUM tokens',
    value: '500 $BONDUM',
    cost: 2000,
    available: 10,
  },
  {
    id: '4',
    type: 'nft',
    title: 'Exclusive Bondum NFT',
    value: 'RARE NFT',
    cost: 15000,
    available: 1,
  },
]

export default function RewardsScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        <View className="items-center mb-4">
          <Text className="text-white text-2xl font-extrabold tracking-wide">
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
              <Text className="text-white text-xl">🔔</Text>
            </Pressable>
            <Avatar source={user?.avatarUrl} size="lg" />
          </View>
        </View>
      </View>

      {/* Rewards List */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-900 text-xl font-bold mb-4">Available Rewards</Text>

        {mockRewards.map((reward) => (
          <Pressable key={reward.id} onPress={() => router.push(`/(tabs)/(rewards)/${reward.id}`)}>
            <Card className="mb-4">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-gray-900 font-bold">
                  {reward.cost.toLocaleString()} <Text className="text-violet-500">$BONDUM</Text>
                </Text>
                <Badge variant="outline">{reward.available} available</Badge>
              </View>

              <Text className="text-gray-700 mb-3">{reward.title}</Text>

              <View
                className={`rounded-xl py-6 items-center ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-red-600'}`}
              >
                <Text className="text-white text-2xl font-extrabold">{reward.value}</Text>
              </View>
            </Card>
          </Pressable>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  )
}
