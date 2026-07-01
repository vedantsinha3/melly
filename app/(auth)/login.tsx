import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Button, Card, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { formatSpotifyOAuthError } from '@/lib/oauth';

function AuthDivider() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);

  return (
    <View style={[styles.dividerRow, { gap: spacing.md, marginVertical: spacing.xs }]}>
      <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
      <Text variant="caption" tone="tertiary">
        OR
      </Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
    </View>
  );
}

function LoginBackdrop() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);

  return (
    <View style={styles.backdrop} pointerEvents="none">
      <View
        style={[
          styles.backdropOrb,
          styles.backdropOrbPrimary,
          { backgroundColor: colors.accentSoft },
        ]}
      />
      <View
        style={[
          styles.backdropOrb,
          styles.backdropOrbSecondary,
          { backgroundColor: colors.surfaceInset },
        ]}
      />
      <View
        style={[
          styles.backdropTile,
          styles.backdropTileOne,
          { backgroundColor: colors.surfaceMuted },
        ]}
      />
      <View
        style={[
          styles.backdropTile,
          styles.backdropTileTwo,
          { backgroundColor: colors.surfaceInset },
        ]}
      />
      <View
        style={[
          styles.backdropTile,
          styles.backdropTileThree,
          { backgroundColor: colors.surfaceMuted },
        ]}
      />
    </View>
  );
}

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, layout, radius, spacing, elevation } = getTheme(colorScheme);
  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithSpotify } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  const busy = emailLoading || spotifyLoading;

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    setEmailLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        Alert.alert('Check your email', 'Confirm your account to continue.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setEmailLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      if ((error as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', error instanceof Error ? error.message : 'Apple Sign-In failed');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSpotifyAuth = async () => {
    setSpotifyLoading(true);
    try {
      await signInWithSpotify();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Spotify Sign-In failed';
      if (!message.toLowerCase().includes('cancel')) {
        Alert.alert('Error', formatSpotifyOAuthError(message));
      }
    } finally {
      setSpotifyLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen contentStyle={styles.center}>
        <Text variant="display" style={styles.centerText}>
          Melly
        </Text>
        <Text variant="body" tone="secondary" style={styles.centerText}>
          Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to get
          started.
        </Text>
      </Screen>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <LoginBackdrop />
      <Screen
        keyboardAvoiding
        omitSafeArea
        contentStyle={{ ...styles.content, maxWidth: layout.compactContentWidth }}>
        <Card
          style={[
            styles.formCard,
            {
              gap: spacing.md,
              borderRadius: radius.xl,
              borderColor: colors.border,
              paddingVertical: spacing['2xl'],
              paddingHorizontal: spacing.xl,
              ...elevation.card,
            },
          ]}>
          <View style={styles.brandBlock}>
            <View style={styles.brandRow}>
              <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
                <Text variant="label" style={styles.logoText}>
                  M
                </Text>
              </View>
              <Text variant="title">Melly</Text>
            </View>
            <Text variant="overline" tone="accent" style={styles.personality}>
              Your taste, organized.
            </Text>
          </View>

          <View style={styles.copyBlock}>
            <Text variant="title" style={styles.headline}>
              Rank the songs that define your taste.
            </Text>
            <Text variant="bodySmall" tone="secondary" style={styles.subcopy}>
              Start building a personal map of what you love powered by Spotify.
            </Text>
          </View>

          <Button
            title="Continue with Spotify"
            onPress={handleSpotifyAuth}
            loading={spotifyLoading}
            disabled={busy && !spotifyLoading}
            accessibilityLabel="Continue with Spotify"
          />

          <AuthDivider />

          <View style={styles.form}>
            <TextField
              label="Email address"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              placeholder="Your password"
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.rowBetween}>
            <Pressable
              onPress={() => setIsSignUp(!isSignUp)}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? 'Switch to sign in' : 'Create account'}>
              <Text variant="bodySmall" tone="secondary">
                {isSignUp ? 'Sign in instead' : 'Create account'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert(
                  'Reset password',
                  'Password reset is coming soon. Use Spotify sign-in or contact support for now.',
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Forgot password">
              <Text variant="bodySmall" tone="accent">
                Forgot password
              </Text>
            </Pressable>
          </View>

          <Button
            title={isSignUp ? 'Create account' : 'Sign in'}
            onPress={handleEmailAuth}
            disabled={busy && !emailLoading}
            loading={emailLoading}
            variant="secondary"
          />

          {Platform.OS === 'ios' ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                colorScheme === 'dark'
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={radius.md}
              style={styles.appleButton}
              onPress={handleAppleAuth}
            />
          ) : null}
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  backdropOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },
  backdropOrbPrimary: {
    width: 420,
    height: 420,
    top: -120,
    right: -80,
  },
  backdropOrbSecondary: {
    width: 320,
    height: 320,
    bottom: -100,
    left: -60,
    opacity: 0.55,
  },
  backdropTile: {
    position: 'absolute',
    borderRadius: 18,
    opacity: 0.18,
  },
  backdropTileOne: {
    width: 88,
    height: 88,
    top: '18%',
    left: '8%',
    transform: [{ rotate: '-8deg' }],
  },
  backdropTileTwo: {
    width: 72,
    height: 72,
    top: '28%',
    right: '12%',
    transform: [{ rotate: '12deg' }],
  },
  backdropTileThree: {
    width: 64,
    height: 64,
    bottom: '22%',
    right: '18%',
    transform: [{ rotate: '-14deg' }],
  },
  center: { justifyContent: 'center' },
  content: {
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  formCard: {
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandBlock: {
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  personality: {
    letterSpacing: 0.8,
  },
  copyBlock: {
    gap: 8,
    marginBottom: 4,
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subcopy: {
    lineHeight: 20,
  },
  centerText: { textAlign: 'center', marginTop: 12 },
  form: {
    gap: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -2,
  },
  appleButton: {
    width: '100%',
    height: 48,
    marginTop: 2,
  },
});
