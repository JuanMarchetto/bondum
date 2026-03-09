import { View, Text } from 'react-native'
import { Button } from './Button'

interface EmptyStateProps {
  icon: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#171717', textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 15, color: '#737373', textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </View>
  )
}
