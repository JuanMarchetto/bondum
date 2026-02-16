import { View, Text, TextInput, Pressable, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Card, Button, Avatar, BellIcon } from '../../../components/ui'

const avatarImage = require('../../../assets/avatar.png')
const bondumLogo = require('../../../assets/bondum_logo.png')
const swapArrows = require('../../../assets/swap_arrows.png')
const usdcCoin = require('../../../assets/usd-coin.png')

export default function TradeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [fromAmount, setFromAmount] = useState('0')
  const [toAmount, setToAmount] = useState('0.00')

  return (
    <View className="flex-1 bg-violet-50">
      {/* Header */}
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        {/* Logo */}
        <View className="items-center mb-4">
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>

        {/* User Info */}
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

      {/* Swap Card */}
      <View className="flex-1 px-4" style={{ paddingTop: 33.6 }}>
        <View className="mb-4">
          <Text className="text-center mb-6">
            <Text className="text-violet-500 font-bold" style={{ fontSize: 43.2 }}>SWAP </Text>
            <Text className="text-gray-900 font-extrabold" style={{ fontSize: 43.2 }}>YOUR TOKENS</Text>
          </Text>

          {/* From Token */}
          <View className="bg-white rounded-2xl mb-2 self-center" style={{ width: '95%', paddingTop: 0, paddingBottom: 5.184, paddingHorizontal: 16, borderWidth: 1, borderColor: '#9b9db5' }}>
            <TextInput
              style={{ 
                fontSize: 100, 
                color: '#000000', 
                fontWeight: 'bold', 
                textAlign: 'center',
                backgroundColor: 'transparent',
                width: '100%',
                minHeight: 27,
                marginTop: -15,
                marginBottom: -20
              }}
              placeholder="0"
              placeholderTextColor="#A3A3A3"
              value={fromAmount}
              onChangeText={setFromAmount}
              keyboardType="numeric"
            />
            <Text className="text-center font-semibold" style={{ color: '#cbc2e2', fontSize: 24, marginTop: -10, marginBottom: 5 }}>$BONDUM</Text>
          </View>

          {/* Swap Arrow */}
          <View className="items-center my-2">
            <View className="bg-violet-100 w-10 h-10 rounded-full items-center justify-center">
              <Image source={swapArrows} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
          </View>

          {/* To Token */}
          <View className="bg-white rounded-2xl self-center relative" style={{ width: '95%', paddingVertical: 5.12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#9b9db5', justifyContent: 'center' }}>
            <View className="absolute left-4 flex-row items-center" style={{ top: '50%', marginTop: -15 }}>
              <View className="w-10 h-10 rounded-full mr-3 overflow-hidden">
                <Image source={usdcCoin} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold">USD Coin</Text>
                <Text className="text-gray-500 text-sm">0.00 USDC</Text>
              </View>
            </View>
            <TextInput
              style={{ 
                fontSize: 69.12, 
                fontWeight: 'bold', 
                textAlign: 'center', 
                width: '100%',
                color: '#000000',
                backgroundColor: 'transparent'
              }}
              placeholder="0.00"
              placeholderTextColor="#A3A3A3"
              value={toAmount}
              onChangeText={(text) => {
                const formatted = text.replace(/[^0-9.]/g, '')
                setToAmount(formatted)
              }}
              keyboardType="numeric"
            />
          </View>

          {/* Swap Button */}
          <View className="items-center mt-6">
            <Button variant="primary" size="lg" style={{ paddingVertical: 10.752, borderRadius: 20.25, width: '75%' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 40.96 }}>Swap</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  )
}
