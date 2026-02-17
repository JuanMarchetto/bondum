import '../global.css'

import { Slot, useRouter, useSegments } from 'expo-router'
import { MobileWalletProvider, createSolanaDevnet } from '@wallet-ui/react-native-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/expo'
import { useEffect } from 'react'
import { AuthContextProvider, useAuth } from '../contexts/AuthContext'

const cluster = createSolanaDevnet()
const identity = {
  name: 'Bondum',
  uri: 'https://bondum.xyz',
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
})

// Privy App ID & Client ID - configure in Privy dashboard
// Get one at https://dashboard.privy.io
const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'
const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to auth if not authenticated
      router.replace('/(auth)/welcome')
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)/(home)')
    }
  }, [isAuthenticated, isLoading, segments, router])

  return <Slot />
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
        <MobileWalletProvider cluster={cluster} identity={identity}>
          <AuthContextProvider>
            <RootLayoutNav />
          </AuthContextProvider>
        </MobileWalletProvider>
      </PrivyProvider>
    </QueryClientProvider>
  )
}
