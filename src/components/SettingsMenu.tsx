import { Text, Pressable, Alert } from 'react-native'
import * as DropdownMenu from 'zeego/dropdown-menu'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../contexts/AuthContext'

interface SettingsMenuProps {
  trigger?: React.ReactNode
}

export function SettingsMenu({ trigger }: SettingsMenuProps) {
  const { address, disconnect, isLoading } = useAuth()

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address)
      Alert.alert('Copied', 'Wallet address copied to clipboard')
    }
  }

  const handleLogout = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Logout error:', error)
      Alert.alert('Error', 'Failed to disconnect. Please try again.')
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {trigger || (
          <Pressable className="p-2">
            <Text className="text-2xl">⚙️</Text>
          </Pressable>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {address ? (
          <DropdownMenu.Item key="copy-address" onSelect={handleCopyAddress}>
            <DropdownMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
            <DropdownMenu.ItemTitle>Copy Wallet Address</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        ) : null}

        <DropdownMenu.Separator />

        <DropdownMenu.Item key="logout" onSelect={handleLogout} destructive disabled={isLoading}>
          <DropdownMenu.ItemIcon ios={{ name: 'rectangle.portrait.and.arrow.right' }} />
          <DropdownMenu.ItemTitle>{isLoading ? 'Disconnecting...' : 'Logout'}</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}

