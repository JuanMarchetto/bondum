import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Card } from '../../components/ui'

type AuthMode = 'select' | 'email' | 'otp'

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const { connectSolana, connectPrivy, verifyPrivyOtp, isLoading, pendingPrivyEmail } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>('select')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSolanaConnect = async () => {
    try {
      setError(null)
      await connectSolana()
    } catch {
      setError('Failed to connect wallet. Please try again.')
    }
  }

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setError(null)
      await connectPrivy(email)
      setAuthMode('otp')
    } catch {
      setError('Failed to send verification code. Please try again.')
    }
  }

  const handleOtpSubmit = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    try {
      setError(null)
      await verifyPrivyOtp(otp)
    } catch {
      setError('Invalid code. Please try again.')
    }
  }

  // OTP verification screen
  if (authMode === 'otp') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 bg-violet-500 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6">
              <Text className="text-violet-500 text-3xl">📧</Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-2">Check your email</Text>
            <Text className="text-violet-200 text-center mb-8">
              We sent a verification code to{'\n'}
              <Text className="font-semibold">{pendingPrivyEmail}</Text>
            </Text>

            <Card className="w-full mb-4">
              <TextInput
                className="text-2xl text-center font-bold text-gray-900 py-4 tracking-widest"
                placeholder="000000"
                placeholderTextColor="#A3A3A3"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </Card>

            {error && <Text className="text-red-200 text-center mb-4">{error}</Text>}

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleOtpSubmit}
              loading={isLoading}
              className="bg-white"
            >
              <Text className="text-violet-500 font-bold text-lg">Verify Code</Text>
            </Button>

            <Pressable
              onPress={() => {
                setAuthMode('email')
                setOtp('')
                setError(null)
              }}
              className="mt-4 py-3"
            >
              <Text className="text-violet-200 text-center">Use different email</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Email input screen
  if (authMode === 'email') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 bg-violet-500 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6">
              <Text className="text-violet-500 text-3xl">✉️</Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-2">Enter your email</Text>
            <Text className="text-violet-200 text-center mb-8">We&apos;ll send you a verification code</Text>

            <Card className="w-full mb-4">
              <TextInput
                className="text-lg text-gray-900 py-4 px-4"
                placeholder="your@email.com"
                placeholderTextColor="#A3A3A3"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </Card>

            {error && <Text className="text-red-200 text-center mb-4">{error}</Text>}

            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={handleEmailSubmit}
              loading={isLoading}
              className="bg-white"
            >
              <Text className="text-violet-500 font-bold text-lg">Continue</Text>
            </Button>

            <Pressable
              onPress={() => {
                setAuthMode('select')
                setEmail('')
                setError(null)
              }}
              className="mt-4 py-3"
            >
              <Text className="text-violet-200 text-center">Back to options</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Auth selection screen (default)
  return (
    <View className="flex-1 bg-violet-500 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Logo Section */}
      <View className="flex-1 items-center justify-center">
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-8 shadow-lg">
          <Text className="text-violet-500 text-4xl font-extrabold">B</Text>
        </View>

        <Text className="text-white text-4xl font-extrabold tracking-wide mb-2">
          B<Text className="text-violet-200">O</Text>NDUM
        </Text>

        <Text className="text-violet-200 text-lg text-center mb-4">Scan. Earn. Enjoy.</Text>

        <Text className="text-violet-100 text-base text-center max-w-xs opacity-80">
          Earn $BONDUM tokens and exclusive NFTs by scanning products and engaging with your favorite brands.
        </Text>
      </View>

      {/* Auth Buttons */}
      <View className="pb-8 gap-4">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleSolanaConnect}
          loading={isLoading}
          className="bg-white"
        >
          <Text className="text-violet-500 font-bold text-lg">Connect Solana Wallet</Text>
        </Button>

        <View className="flex-row items-center gap-4 my-2">
          <View className="flex-1 h-px bg-violet-400" />
          <Text className="text-violet-200 text-sm">or</Text>
          <View className="flex-1 h-px bg-violet-400" />
        </View>

        <Button variant="outline" size="lg" fullWidth onPress={() => setAuthMode('email')} className="bg-white">
          <Text className="text-violet-500 font-bold text-lg">Continue with Email</Text>
        </Button>

        {error && <Text className="text-red-200 text-center mt-2">{error}</Text>}

        <Pressable className="py-3 mt-2">
          <Text className="text-violet-200 text-center font-medium">Continue as Guest</Text>
        </Pressable>
      </View>
    </View>
  )
}
