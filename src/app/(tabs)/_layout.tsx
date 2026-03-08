import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useLanguage } from '../../contexts/LanguageContext'

const TAB_ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  home: { focused: 'home', unfocused: 'home-outline' },
  trade: { focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  assets: { focused: 'wallet', unfocused: 'wallet-outline' },
  rewards: { focused: 'gift', unfocused: 'gift-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
}

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icon = TAB_ICONS[name] || TAB_ICONS.home
  return (
    <Ionicons
      name={focused ? icon.focused : icon.unfocused}
      size={24}
      color={focused ? '#8B5CF6' : '#A3A3A3'}
    />
  )
}

export default function TabsLayout() {
  const { t } = useLanguage()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          paddingTop: 8,
          paddingBottom: 24,
          height: 80,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#A3A3A3',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(trade)"
        options={{
          title: t('tabs.trade'),
          tabBarIcon: ({ focused }) => <TabIcon name="trade" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(assets)"
        options={{
          title: t('tabs.wallet'),
          tabBarIcon: ({ focused }) => <TabIcon name="assets" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(rewards)"
        options={{
          title: t('tabs.rewards'),
          tabBarIcon: ({ focused }) => <TabIcon name="rewards" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
