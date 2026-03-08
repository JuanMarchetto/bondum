import { View, type ViewStyle } from 'react-native'
import { Image as ExpoImage } from 'expo-image'
import { getPanicafeCouponImage } from '../utils/panicafeCoupons'

const SIZES = {
  sm: { width: '100%' as const, height: 160 },
  md: { width: '100%' as const, height: 220 },
  lg: { width: '100%' as const, height: 280 },
}

interface Props {
  value?: string
  cost?: number
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

export function PanicafeCouponCard({ value, cost, size = 'md', style }: Props) {
  const source = getPanicafeCouponImage(value, cost)
  const dimensions = SIZES[size]

  return (
    <View style={[{ borderRadius: 16, overflow: 'hidden' }, style]}>
      <ExpoImage
        source={source}
        style={{ width: dimensions.width, height: dimensions.height }}
        contentFit="cover"
        transition={200}
      />
    </View>
  )
}
