import Svg, { Path } from 'react-native-svg'

interface ChevronBackProps {
  size?: number
  color?: string
}

export function ChevronBack({ size = 28, color = 'white' }: ChevronBackProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
