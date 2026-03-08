import { Text, Pressable, Alert } from 'react-native'
import * as DropdownMenu from 'zeego/dropdown-menu'
import * as Clipboard from 'expo-clipboard'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

interface SettingsMenuProps {
  trigger?: React.ReactNode
}

export function SettingsMenu({ trigger }: SettingsMenuProps) {
  const { address, disconnect, isLoading } = useAuth()
  const { t } = useLanguage()

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address)
      Alert.alert(t('settingsMenu.copied'), t('settingsMenu.copiedMessage'))
    }
  }

  const handleLogout = async () => {
    try {
      await disconnect()
    } catch {
      Alert.alert(t('common.error'), t('settingsMenu.disconnectFailed'))
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {trigger || (
          <Pressable className="p-2">
            <Text className="text-2xl">{'\u2699\uFE0F'}</Text>
          </Pressable>
        )}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {address ? (
          <DropdownMenu.Item key="copy-address" onSelect={handleCopyAddress}>
            <DropdownMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
            <DropdownMenu.ItemTitle>{t('settingsMenu.copyAddress')}</DropdownMenu.ItemTitle>
          </DropdownMenu.Item>
        ) : null}

        <DropdownMenu.Separator />

        <DropdownMenu.Item key="logout" onSelect={handleLogout} destructive disabled={isLoading}>
          <DropdownMenu.ItemIcon ios={{ name: 'rectangle.portrait.and.arrow.right' }} />
          <DropdownMenu.ItemTitle>{isLoading ? t('settingsMenu.disconnecting') : t('settingsMenu.logout')}</DropdownMenu.ItemTitle>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
