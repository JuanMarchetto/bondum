import { Pressable, View, Text } from 'react-native'
import type { ReactNode } from 'react'

interface IconButtonProps {
  icon: ReactNode
  label?: string
  onPress?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
}

const variantClasses = {
  default: 'bg-violet-100',
  outline: 'bg-white border border-violet-200',
}

export function IconButton({
  icon,
  label,
  onPress,
  size = 'md',
  variant = 'default',
  className = '',
}: IconButtonProps) {
  return (
    <Pressable onPress={onPress} className={`items-center ${className}`}>
      <View
        className={`
          rounded-full items-center justify-center
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
      >
        {icon}
      </View>
      {label && <Text className="text-violet-500 text-xs mt-2 font-medium">{label}</Text>}
    </Pressable>
  )
}
