import { View, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'

interface ScreenContainerProps {
  children: ReactNode
  scroll?: boolean
  className?: string
  padded?: boolean
}

export function ScreenContainer({ children, scroll = true, className = '', padded = true }: ScreenContainerProps) {
  const insets = useSafeAreaInsets()

  const content = (
    <View
      className={`flex-1 bg-violet-50 ${padded ? 'px-4' : ''} ${className}`}
      style={{ paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  )

  if (scroll) {
    return (
      <ScrollView
        className="flex-1 bg-violet-50"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    )
  }

  return content
}
