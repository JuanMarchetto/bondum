import { Stack } from 'expo-router'

export default function ScanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    />
  )
}
