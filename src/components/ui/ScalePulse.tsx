import { useEffect, useRef } from 'react'
import { Animated, type ViewStyle } from 'react-native'

interface ScalePulseProps {
  children: React.ReactNode
  style?: ViewStyle
}

export function ScalePulse({ children, style }: ScalePulseProps) {
  const scale = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }, [scale])

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      {children}
    </Animated.View>
  )
}
