import { useEffect, useRef } from 'react'
import { Animated, type ViewStyle } from 'react-native'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  slideUp?: number
  style?: ViewStyle
}

export function FadeIn({ children, delay = 0, duration = 400, slideUp = 12, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(slideUp)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, translateY, delay, duration])

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  )
}
