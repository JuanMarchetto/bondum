import { Text, Pressable, Alert } from 'react-native'
import { MenuView } from '@react-native-menu/menu'
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
    <MenuView
      testID="settings-menu"
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'copy-address') handleCopyAddress()
        if (nativeEvent.event === 'logout') handleLogout()
      }}
      actions={[
        ...(address
          ? [
              {
                id: 'copy-address',
                title: t('settingsMenu.copyAddress'),
                image: 'doc.on.doc',
              },
            ]
          : []),
        {
          id: 'logout',
          title: isLoading ? t('settingsMenu.disconnecting') : t('settingsMenu.logout'),
          image: 'rectangle.portrait.and.arrow.right',
          attributes: {
            destructive: true,
            disabled: isLoading,
          },
        },
      ]}
    >
      {trigger || (
        <Pressable className="p-2">
          <Text className="text-2xl">{'\u2699\uFE0F'}</Text>
        </Pressable>
      )}
    </MenuView>
  )
}
