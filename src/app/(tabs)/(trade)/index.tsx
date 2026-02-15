import { View, Text, TextInput, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Button, Avatar } from '../../../components/ui'

export default function TradeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="items-center mb-4">
          <Text className="text-white text-2xl font-extrabold tracking-wide">
            B<Text className="text-violet-200">O</Text>NDUM
          </Text>
        </View>

        {/* User Info */}
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

      {/* Swap Card */}
      <View className="flex-1 px-4 pt-6">
        <Card className="mb-4" padding="lg">
          <Text className="text-center mb-6">
            <Text className="text-violet-500 text-xl font-bold italic">SWAP </Text>
            <Text className="text-gray-900 text-xl font-extrabold">YOUR TOKENS</Text>
          </Text>

          {/* From Token */}
          <View className="bg-gray-50 rounded-2xl p-4 mb-2">
            <TextInput
              className="text-4xl font-bold text-center text-gray-900"
              placeholder="0"
              placeholderTextColor="#A3A3A3"
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="numeric"
            />
            <Text className="text-violet-500 text-center font-semibold mt-1">$BONDUM</Text>
          </View>

          {/* Swap Arrow */}
          <View className="items-center my-2">
            <View className="bg-violet-100 w-10 h-10 rounded-full items-center justify-center">
              <Text className="text-violet-500 text-xl">↕️</Text>
            </View>
          </View>

          {/* To Token */}
          <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                <Text className="text-white font-bold">$</Text>
              </View>
              <View>
                <Text className="text-gray-900 font-bold">USD Coin</Text>
                <Text className="text-gray-500 text-sm">0.00 USDC</Text>
              </View>
            </View>
            <TextInput
              className="text-3xl font-bold text-gray-900 text-right flex-1"
              placeholder="0,00"
              placeholderTextColor="#A3A3A3"
              value={toAmount}
              onChangeText={setToAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Swap Button */}
          <Button variant="primary" size="lg" fullWidth className="mt-6">
            Swap
          </Button>
        </Card>
      </View>
    </View>
  )
}
