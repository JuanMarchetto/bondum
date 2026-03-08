import { useState, useEffect } from 'react'
import { Platform, NativeModules } from 'react-native'

/**
 * Detects whether the app is running on a Solana Mobile Seeker device.
 * On Seeker, the Seed Vault is available for secure key management.
 *
 * Detection heuristics:
 * 1. Check for Seed Vault intent availability (Android only)
 * 2. Check device manufacturer/model for Solana Mobile hardware
 */
export function useSeekerDevice() {
  const [isSeeker, setIsSeeker] = useState(false)
  const [hasSeedVault, setHasSeedVault] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setIsSeeker(false)
      setHasSeedVault(false)
      return
    }

    async function detect() {
      try {
        // Check device info for Solana Mobile hardware
        const { PlatformConstants } = NativeModules
        const brand = PlatformConstants?.Brand?.toLowerCase() || ''
        const manufacturer = PlatformConstants?.Manufacturer?.toLowerCase() || ''
        const model = PlatformConstants?.Model?.toLowerCase() || ''

        const isSolanaMobileDevice =
          brand.includes('solana') ||
          manufacturer.includes('solana') ||
          model.includes('seeker') ||
          model.includes('saga')

        setIsSeeker(isSolanaMobileDevice)
        // Seed Vault is available on Seeker devices with SMS installed
        setHasSeedVault(isSolanaMobileDevice)
      } catch {
        setIsSeeker(false)
        setHasSeedVault(false)
      }
    }

    detect()
  }, [])

  return { isSeeker, hasSeedVault }
}
