// iOS + Web fallback: MWA is Android-only (TurboModule crashes on iOS)
import type { ReactNode } from 'react'

export function MobileWalletProvider({ children }: { children: ReactNode; cluster?: any; identity?: any }) {
  return children as any
}

export function createSolanaMainnet(_url?: string) {
  return null as any
}

export function useMobileWallet() {
  return {
    account: null,
    connect: async () => {},
    disconnect: async () => {},
  } as any
}
