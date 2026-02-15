import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import { usePrivy, useLoginWithEmail, useEmbeddedSolanaWallet } from '@privy-io/expo'
import { secureStorage } from '../services/storage'
import type { AuthState, AuthProvider as AuthProviderType, User } from '../types'

interface AuthContextValue extends AuthState {
  connectSolana: () => Promise<void>
  connectPrivy: (email: string) => Promise<void>
  verifyPrivyOtp: (code: string) => Promise<void>
  disconnect: () => Promise<void>
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

  const solanaWallet = useMobileWallet()
  const { isReady: isPrivyReady, user: privyUser, logout: privyLogout } = usePrivy()
  const { sendCode, loginWithCode, state: privyLoginState } = useLoginWithEmail()
  const embeddedWallet = useEmbeddedSolanaWallet()

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
      } catch (error) {
        console.error('Error checking auth:', error)
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
        username: 'User',
        balance: 15000,
        nftCount: 7,
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
      const emailAccount = privyUser.linked_accounts?.find((account) => account.type === 'email') as
        | { address?: string }
        | undefined

      const user: User = {
        id: privyUser.id,
        username: 'User',
        balance: 15000,
        nftCount: 7,
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
      console.error('Solana connect error:', error)
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
        console.error('Privy connect error:', error)
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
        console.error('Privy OTP verification error:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [pendingPrivyEmail, loginWithCode],
  )

  const disconnect = useCallback(async () => {
    setIsLoading(true)
    try {
      if (authState.provider === 'solana') {
        await solanaWallet.disconnect()
      } else if (authState.provider === 'privy') {
        await privyLogout()
      }

      await secureStorage.clearAuth()

      setAuthState({
        isAuthenticated: false,
        provider: null,
        address: null,
        user: null,
      })
    } catch (error) {
      console.error('Disconnect error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [authState.provider, solanaWallet, privyLogout])

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        connectSolana,
        connectPrivy,
        verifyPrivyOtp,
        disconnect,
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
