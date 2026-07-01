import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen contentStyle={styles.container}>
        <Text variant="title" style={styles.title}>This screen doesn't exist.</Text>
        <View style={styles.buttonWrap}>
          <Link href="/" asChild>
            <Button title="Go to home screen" />
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  buttonWrap: {
    marginTop: 16,
    width: '100%',
    maxWidth: 320,
  },
});
