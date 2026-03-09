import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { Platform } from 'react-native'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { usePrivy, useLoginWithEmail, useEmbeddedSolanaWallet } from '@privy-io/expo'
import { useQueryClient } from '@tanstack/react-query'
import { secureStorage } from '../services/storage'
import type { AuthState, AuthProvider as AuthProviderType, User } from '../types'

interface AuthContextValue extends AuthState {
  connectSolana: () => Promise<void>
  connectPrivy: (email: string) => Promise<void>
  verifyPrivyOtp: (code: string) => Promise<void>
  connectAsGuest: () => void
  disconnect: () => Promise<void>
  getPrivyAccessToken: () => Promise<string | null>
  isLoading: boolean
  pendingPrivyEmail: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthContextProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    provider: null,
    address: null,
    user: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [pendingPrivyEmail, setPendingPrivyEmail] = useState<string | null>(null)

  const queryClient = useQueryClient()
  // On web, these native-only hooks are unavailable (providers skipped)
  const solanaWallet = Platform.OS === 'web' ? { account: null, connect: async () => {}, disconnect: async () => {} } as any : useMobileWallet()
  const { isReady: isPrivyReady, user: privyUser, logout: privyLogout, getAccessToken } = Platform.OS === 'web'
    ? { isReady: false, user: null, logout: async () => {}, getAccessToken: async () => null } as any
    : usePrivy()
  const { sendCode, loginWithCode, state: privyLoginState } = Platform.OS === 'web'
    ? { sendCode: async () => {}, loginWithCode: async () => {}, state: { status: 'idle' } } as any
    : useLoginWithEmail()
  const embeddedWallet = Platform.OS === 'web' ? { status: 'not-connected', wallets: [] } as any : useEmbeddedSolanaWallet()

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const provider = await secureStorage.getAuthProvider()
        const userData = await secureStorage.getUserData()

        if (provider && userData) {
          setAuthState({
            isAuthenticated: true,
            provider: provider as AuthProviderType,
            address: userData.address || null,
            user: userData.user || null,
          })
        }
      } catch {
        // Failed to restore auth; user will see the login screen
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Sync Solana wallet state
  useEffect(() => {
    if (solanaWallet.account && !authState.isAuthenticated) {
      const address = solanaWallet.account.address.toString()
      const user: User = {
        id: address,
        username: `${address.slice(0, 4)}...${address.slice(-4)}`,
        avatarUrl: null,
      }

      setAuthState({
        isAuthenticated: true,
        provider: 'solana',
        address,
        user,
      })

      // Persist auth state
      secureStorage.setAuthProvider('solana')
      secureStorage.setUserData({ address, user })
    }
  }, [solanaWallet.account, authState.isAuthenticated])

  // Sync Privy auth state
  useEffect(() => {
    if (privyUser && !authState.isAuthenticated && isPrivyReady) {
      // Get wallet address from embedded wallet if available
      const address = embeddedWallet?.wallets?.[0]?.address || privyUser.id

      // Find email from linked accounts
      const emailAccount = privyUser.linked_accounts?.find((account: any) => account.type === 'email') as
        | { address?: string }
        | undefined

      const user: User = {
        id: privyUser.id,
        username: emailAccount?.address || `${address.slice(0, 4)}...${address.slice(-4)}`,
        avatarUrl: null,
      }

      setAuthState({
        isAuthenticated: true,
        provider: 'privy',
        address,
        user,
      })

      // Persist auth state
      secureStorage.setAuthProvider('privy')
      secureStorage.setUserData({ address, user })
    }
  }, [privyUser, authState.isAuthenticated, isPrivyReady, embeddedWallet])

  const connectSolana = useCallback(async () => {
    setIsLoading(true)
    try {
      await solanaWallet.connect()
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [solanaWallet])

  const connectPrivy = useCallback(
    async (email: string) => {
      setIsLoading(true)
      try {
        setPendingPrivyEmail(email)
        await sendCode({ email })
      } catch (error) {
        setPendingPrivyEmail(null)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [sendCode],
  )

  const verifyPrivyOtp = useCallback(
    async (code: string) => {
      if (!pendingPrivyEmail) {
        throw new Error('No pending email verification')
      }

      setIsLoading(true)
      try {
        await loginWithCode({ code, email: pendingPrivyEmail })
        setPendingPrivyEmail(null)
      } catch (error) {
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [pendingPrivyEmail, loginWithCode],
  )

  const connectAsGuest = useCallback(() => {
    const demoAddress = 'Demo7xR4nkJv9fS2mBqazALp8xKYcPe3z'
    const user: User = {
      id: 'guest',
      username: 'Bondum User',
      avatarUrl: null,
    }

    setAuthState({
      isAuthenticated: true,
      provider: 'guest',
      address: demoAddress,
      user,
    })

    secureStorage.setAuthProvider('guest')
    secureStorage.setUserData({ address: demoAddress, user })
  }, [])

  const disconnect = useCallback(async () => {
    setIsLoading(true)
    try {
      if (authState.provider === 'solana') {
        await solanaWallet.disconnect()
      } else if (authState.provider === 'privy') {
        await privyLogout()
      }

      await secureStorage.clearAuth()

      // Wipe every query from the cache so stale balances from
      // the previous wallet are never shown on the next login
      queryClient.removeQueries()
      queryClient.clear()

      setAuthState({
        isAuthenticated: false,
        provider: null,
        address: null,
        user: null,
      })
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authState.provider, solanaWallet, privyLogout, queryClient])

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        connectSolana,
        connectPrivy,
        verifyPrivyOtp,
        connectAsGuest,
        disconnect,
        getPrivyAccessToken: getAccessToken,
        isLoading: isLoading || privyLoginState.status === 'sending-code',
        pendingPrivyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}
