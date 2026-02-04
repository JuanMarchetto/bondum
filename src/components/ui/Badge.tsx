import { View, Text } from 'react-native'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'outline'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-violet-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  error: 'bg-red-100',
  outline: 'bg-white border border-violet-500',
}

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-violet-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  outline: 'text-violet-500',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <View
      className={`
        px-3 py-1 rounded-lg
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {typeof children === 'string' ? (
        <Text
          className={`
            text-sm font-semibold
            ${variantTextClasses[variant]}
          `}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  )
}
