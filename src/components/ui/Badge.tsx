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
  outline: 'bg-white',
}

const variantTextClasses: Record<BadgeVariant, string> = {
  default: 'text-violet-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  outline: '',
}

const variantTextColors: Record<BadgeVariant, string | undefined> = {
  default: undefined,
  success: undefined,
  warning: undefined,
  error: undefined,
  outline: '#8b5cf6',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <View
      className={`
        px-3 py-1
        ${variantClasses[variant]}
        ${className}
      `}
      style={variant === 'outline'
        ? { borderWidth: 2, borderColor: '#8b5cf6', borderRadius: 12 }
        : { borderRadius: 8 }
      }
    >
      <Text
        className={`
          text-sm font-extrabold
          ${variantTextClasses[variant]}
        `}
        style={variantTextColors[variant] ? { color: variantTextColors[variant] } : undefined}
      >
        {children}
      </Text>
    </View>
  )
}
