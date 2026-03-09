import { View, type ViewStyle, type ImageStyle } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import Svg, { Circle, Path } from 'react-native-svg'

// SVG user silhouette for consistent cross-device rendering

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom'

interface AvatarProps {
  source?: string | ImageSource | number | null
  size?: AvatarSize
  customSize?: number
  className?: string
  style?: ViewStyle
}

const sizeValues: Record<Exclude<AvatarSize, 'custom'>, number> = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
}

export function Avatar({ source, size = 'md', customSize, className = '', style }: AvatarProps) {
  const s = size === 'custom' && customSize ? customSize : sizeValues[size as Exclude<AvatarSize, 'custom'>]

  if (!source) {
    return (
      <View
        className={className}
        style={[
          {
            width: s,
            height: s,
            borderRadius: s / 2,
            backgroundColor: '#ddd8fe',
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="8" r="4" fill="#8b66df" />
          <Path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" fill="#8b66df" />
        </Svg>
      </View>
    )
  }

  return (
    <Image
      source={source}
      className={className}
      style={[
        {
          width: s,
          height: s,
          borderRadius: s / 2,
        } as ImageStyle,
        style as ImageStyle,
      ]}
      contentFit="cover"
      transition={200}
    />
  )
}
