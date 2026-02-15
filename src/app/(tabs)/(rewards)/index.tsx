import { View, Text, ScrollView, Pressable, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Badge, Avatar, BellIcon } from '../../../components/ui'

const avatarImage = require('../../../assets/avatar.png')
const bondumLogo = require('../../../assets/bondum_logo.png')

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
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold" style={{ fontSize: 24 }}>Hello, {user?.username || 'User'}!</Text>
            <Text className="text-violet-200" style={{ fontSize: 19 }}>{(user?.balance || 0).toLocaleString()} $BONDUM</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="p-2">
              <BellIcon size={32} color="white" />
            </Pressable>
            <Avatar source={avatarImage} size="lg" style={{ borderWidth: 2, borderColor: 'white' }} />
          </View>
        </View>
      </View>

      {/* Rewards List */}
      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-900 text-xl font-bold mb-4">Available Rewards</Text>

        {mockRewards.map((reward) => (
          <Pressable key={reward.id} onPress={() => router.push(`/(tabs)/(rewards)/${reward.id}`)}>
            <View className="mb-4 bg-gray-100 rounded-3xl p-5" style={{ borderWidth: 1, borderColor: '#9b9db5' }}>
              <View className="flex-row items-start justify-between" style={{ marginBottom: 2 }}>
                <Text className="text-violet-500 text-lg font-bold">Reward</Text>
                <Badge variant="outline">{reward.available} available</Badge>
              </View>

              <Text className="text-gray-900 font-semibold mb-5">{reward.title}</Text>

              <View
                className={`rounded-xl py-10 items-center ${reward.type === 'nft' ? 'bg-violet-500' : 'bg-red-600'}`}
              >
                <Text className="text-white text-7xl font-extrabold">{reward.value}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  )
}
