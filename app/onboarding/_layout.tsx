import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="import" options={{ title: 'Import your music', headerShown: false }} />
    </Stack>
  );
}
