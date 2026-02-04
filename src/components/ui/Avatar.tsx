import { View } from 'react-native'
import { Image } from 'expo-image'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  source?: string | null
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
}

export function Avatar({ source, size = 'md', className = '' }: AvatarProps) {
  if (!source) {
    return (
      <View
        className={`
          rounded-full bg-violet-200 items-center justify-center
          ${sizeClasses[size]}
          ${className}
        `}
      />
    )
  }

  return (
    <Image
      source={{ uri: source }}
      className={`
        rounded-full
        ${sizeClasses[size]}
        ${className}
      `}
      contentFit="cover"
      transition={200}
    />
  )
}
