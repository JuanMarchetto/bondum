import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeekerDevice } from '../../hooks/useSeekerDevice'
import { Button, Card } from '../../components/ui'
import { useLanguage } from '../../contexts/LanguageContext'

const bondumLogo = require('../../assets/bondum_logo.png')
const bLogo = require('../../assets/b-logo.png')

type AuthMode = 'select' | 'email' | 'otp'

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const { connectSolana, connectPrivy, verifyPrivyOtp, connectAsGuest, isLoading, pendingPrivyEmail } = useAuth()
  const { isSeeker, hasSeedVault } = useSeekerDevice()
  const { t } = useLanguage()
  const [authMode, setAuthMode] = useState<AuthMode>('select')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSolanaConnect = async () => {
    try {
      setError(null)
      await connectSolana()
    } catch {
      setError(t('welcome.failedConnect'))
    }
  }

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError(t('welcome.invalidEmail'))
      return
    }

    try {
      setError(null)
      await connectPrivy(email)
      setAuthMode('otp')
    } catch (err: any) {
      const message = err?.error || err?.message || 'Unknown error'
      setError(t('welcome.failedSendCode', { message }))
    }
  }

  const handleOtpSubmit = async () => {
    if (!otp || otp.length < 6) {
      setError(t('welcome.enterOtp'))
      return
    }

    try {
      setError(null)
      await verifyPrivyOtp(otp)
    } catch {
      setError(t('welcome.invalidCode'))
    }
  }

  // OTP verification screen
  if (authMode === 'otp') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#8b66df' }}>
          <View className="flex-1 items-center" style={{ paddingTop: 60, justifyContent: 'flex-start' }}>
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6">
              <Text className="text-violet-500 text-3xl">{'\u{1F4E7}'}</Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-2">{t('welcome.checkEmail')}</Text>
            <Text className="text-violet-200 text-center mb-8">
              {t('welcome.verificationSent')}{'\n'}
              <Text className="font-semibold">{pendingPrivyEmail}</Text>
            </Text>

            <Card className="w-full mb-4">
              <TextInput
                className="text-2xl text-center font-bold text-gray-900 py-4 tracking-widest"
                placeholder={t('welcome.otpPlaceholder')}
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
              style={{ paddingVertical: 16, marginTop: 48 }}
            >
              <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>{t('welcome.verifyCode')}</Text>
            </Button>

            <Pressable
              onPress={() => {
                setAuthMode('email')
                setOtp('')
                setError(null)
              }}
              className="mt-4 py-3"
            >
              <Text className="text-violet-200 text-center">{t('welcome.useDifferentEmail')}</Text>
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
        <View className="flex-1 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#8b66df' }}>
          <View className="flex-1 items-center" style={{ paddingTop: 60, justifyContent: 'flex-start' }}>
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-6">
              <Text className="text-violet-500 text-3xl">{'\u2709\uFE0F'}</Text>
            </View>

            <Text className="text-white text-2xl font-bold mb-2">{t('welcome.enterEmail')}</Text>
            <Text className="text-violet-200 text-center mb-8">{t('welcome.sendCode')}</Text>

            <Card className="w-full mb-4">
              <TextInput
                className="text-lg text-gray-900 py-4 px-4"
                placeholder={t('welcome.emailPlaceholder')}
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
              style={{ paddingVertical: 16, marginTop: 48 }}
            >
              <Text className="text-violet-500 font-bold" style={{ fontSize: 36 }}>{t('welcome.continue')}</Text>
            </Button>

            <Pressable
              onPress={() => {
                setAuthMode('select')
                setEmail('')
                setError(null)
              }}
              className="mt-4 py-3"
            >
              <Text className="text-violet-200 text-center">{t('welcome.backToOptions')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // Auth selection screen (default)
  return (
    <View className="flex-1 px-8" style={{ paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: '#8b66df' }}>
      {/* Logo Section */}
      <View className="flex-1 items-center justify-center">
        <View className="w-32 h-32 bg-white rounded-full items-center justify-center mb-8 shadow-lg">
          <Image source={bLogo} style={{ width: 96, height: 96, resizeMode: 'contain' }} />
        </View>

        <View className="mb-2">
          <Image source={bondumLogo} style={{ width: 128, height: 64, resizeMode: 'contain' }} />
        </View>

        <Text className="text-violet-200 text-lg text-center mb-4">{t('welcome.tagline')}</Text>

        <Text className="text-violet-100 text-base text-center max-w-xs opacity-80">
          {t('welcome.subtitle')}
        </Text>
      </View>

      {/* Auth Buttons */}
      <View className="pb-8 gap-4">
        {hasSeedVault ? (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleSolanaConnect}
            loading={isLoading}
            className="bg-white"
            style={{ paddingVertical: 21.6, borderWidth: 2, borderColor: '#22c55e' }}
          >
            <Text className="text-violet-500 font-bold" style={{ fontSize: 24 }}>{t('welcome.connectSeedVault')}</Text>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleSolanaConnect}
            loading={isLoading}
            className="bg-white"
            style={{ paddingVertical: 21.6 }}
          >
            <Text className="text-violet-500 font-bold" style={{ fontSize: 24 }}>{t('welcome.connectSolana')}</Text>
          </Button>
        )}

        {isSeeker && (
          <Text className="text-green-300 text-center text-xs">{t('welcome.seekerDetected')}</Text>
        )}

        <View className="flex-row items-center gap-4 my-2">
          <View className="flex-1 h-px bg-violet-400" />
          <Text className="text-violet-200 text-sm">{t('common.or')}</Text>
          <View className="flex-1 h-px bg-violet-400" />
        </View>

        <Button variant="outline" size="lg" fullWidth onPress={() => setAuthMode('email')} className="bg-white" style={{ paddingVertical: 21.6 }}>
          <Text className="text-violet-500 font-bold" style={{ fontSize: 24 }}>{t('welcome.continueEmail')}</Text>
        </Button>

        {error && <Text className="text-red-200 text-center mt-2">{error}</Text>}

        <Pressable onPress={connectAsGuest} className="py-3 mt-2">
          <Text className="text-violet-200 text-center font-medium">{t('welcome.continueGuest')}</Text>
        </Pressable>
      </View>
    </View>
  )
}
