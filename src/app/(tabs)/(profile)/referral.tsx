import { View, Text, Pressable, Image, Share, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../../components/ui'
import { getReferralStats } from '../../../services/rewardApi'

const bondumLogo = require('../../../assets/bondum_logo.png')

export default function ReferralScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { address } = useAuth()
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({ referralCode: '', referralCount: 0, totalEarned: 0 })

  const referralLink = address ? `bondum://refer?code=${address.slice(0, 8)}` : ''

  useEffect(() => {
    if (address) {
      getReferralStats(address).then(setStats)
    }
  }, [address])

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Bondum and earn loyalty rewards on Solana! Use my referral code: ${stats.referralCode}\n\nDownload: https://bondum.xyz`,
      })
    } catch {
      Alert.alert('Error', 'Failed to share referral link')
    }
  }

  return (
    <View className="flex-1 bg-violet-50">
      <View className="px-5 pb-6 rounded-b-3xl" style={{ paddingTop: insets.top + 16, backgroundColor: '#8b66df' }}>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Text className="text-white text-3xl">{'\u2190'}</Text>
          </Pressable>
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 px-5 pt-8">
        <Text className="text-center mb-2">
          <Text className="text-violet-500 font-bold" style={{ fontSize: 32 }}>INVITE </Text>
          <Text className="text-gray-900 font-extrabold" style={{ fontSize: 32 }}>FRIENDS</Text>
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          Share your referral code and both you and your friend earn bonus $BONDUM tokens
        </Text>

        {/* Referral Code */}
        <View className="bg-white rounded-2xl p-5 mb-4" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Text className="text-gray-400 text-xs mb-1">YOUR REFERRAL CODE</Text>
          <Text className="text-gray-900 font-bold text-2xl mb-3">{stats.referralCode || '...'}</Text>
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={handleCopy} style={{ flex: 1 }}>
              <Text style={{ fontSize: 16 }}>{copied ? 'Copied!' : 'Copy Link'}</Text>
            </Button>
            <Button variant="primary" onPress={handleShare} style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: '#FFFFFF' }}>Share</Text>
            </Button>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-5 items-center" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
            <Text className="text-violet-500 font-extrabold text-3xl">{stats.referralCount}</Text>
            <Text className="text-gray-500 text-sm">Friends Invited</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-5 items-center" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
            <Text className="text-violet-500 font-extrabold text-3xl">{stats.totalEarned}</Text>
            <Text className="text-gray-500 text-sm">$BONDUM Earned</Text>
          </View>
        </View>

        {/* How it works */}
        <Text className="text-gray-900 font-bold text-lg mb-3">How it works</Text>
        <View className="bg-white rounded-2xl p-5" style={{ borderWidth: 1, borderColor: '#E5E5E5' }}>
          <Step number={1} text="Share your referral code with friends" />
          <Step number={2} text="They sign up and scan their first QR code" />
          <Step number={3} text="Both of you receive bonus $BONDUM tokens on-chain" />
        </View>
      </View>
    </View>
  )
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View className="flex-row items-center mb-3 last:mb-0">
      <View className="w-8 h-8 rounded-full bg-violet-100 items-center justify-center mr-3">
        <Text className="text-violet-500 font-bold">{number}</Text>
      </View>
      <Text className="text-gray-700 flex-1">{text}</Text>
    </View>
  )
}
