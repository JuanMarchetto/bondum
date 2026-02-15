import { View, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md', style }: CardProps) {
  return (
    <View
      className={`
        bg-white rounded-2xl shadow-sm
        ${paddingClasses[padding]}
        ${className}
      `}
      style={style}
    >
      {children}
    </View>
  )
}
