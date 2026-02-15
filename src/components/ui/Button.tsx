import { Pressable, Text, ActivityIndicator, View, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  onPress?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  className?: string
  style?: ViewStyle
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-violet-500 active:bg-violet-600',
  secondary: 'bg-red-600 active:bg-red-700',
  outline: 'bg-white border-2 border-violet-500 active:bg-violet-50',
  ghost: 'bg-transparent active:bg-violet-50',
}

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-violet-500',
  ghost: 'text-violet-500',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-4',
}

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading

  const hasCustomBorderRadius = style?.borderRadius !== undefined

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`
        ${hasCustomBorderRadius ? '' : 'rounded-full'} items-center justify-center flex-row
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : '#8B5CF6'}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {typeof children === 'string' ? (
            <Text
              className={`
                font-bold
                ${variantTextClasses[variant]}
                ${sizeTextClasses[size]}
              `}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  )
}
