import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Card, LoadingState, Screen, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { formatSpotifyOAuthError } from '@/lib/oauth';

export default function AuthCallbackScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { loading, session } = useAuth();

  if (loading || session) {
    return <LoadingState />;
  }

  return (
    <Screen contentStyle={styles.container}>
      <Card style={[styles.card, { gap: spacing.md }]}>
        <Text variant="title" style={styles.center}>
          Confirm your Spotify email
        </Text>
        <Text variant="body" tone="secondary" style={styles.center}>
          {formatSpotifyOAuthError('unverified email')}
        </Text>
        <View style={styles.linkWrap}>
          <Link href="/(auth)/login" style={[styles.link, { color: colors.tint }]}>
            Back to sign in
          </Link>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  card: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  center: { textAlign: 'center' },
  linkWrap: { alignItems: 'center' },
  link: { fontSize: 16, fontWeight: '700', paddingVertical: 8 },
});
