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

const sizeValues = {
  sm: 40,
  md: 56,
  lg: 64,
}

const variantClasses = {
  default: '',
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
        style={{
          width: sizeValues[size],
          height: sizeValues[size],
          borderRadius: sizeValues[size] / 2,
          alignItems: 'center',
          justifyContent: 'center',
          ...(variant === 'default' ? { backgroundColor: '#e7e9f6' } : {}),
        }}
      >
        {icon}
      </View>
      {label && <Text className="text-lg mt-2 font-medium" style={{ color: '#9b9db5' }}>{label}</Text>}
    </Pressable>
  )
}
