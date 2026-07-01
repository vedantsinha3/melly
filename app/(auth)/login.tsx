import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { Button, Card, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { formatSpotifyOAuthError } from '@/lib/oauth';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, layout, radius, spacing } = getTheme(colorScheme);
  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithSpotify } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password.');
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error) {
      if ((error as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', error instanceof Error ? error.message : 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpotifyAuth = async () => {
    setLoading(true);
    try {
      await signInWithSpotify();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Spotify Sign-In failed';
      if (!message.toLowerCase().includes('cancel')) {
        Alert.alert('Error', formatSpotifyOAuthError(message));
      }
    } finally {
      setLoading(false);
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
    <Screen
      keyboardAvoiding
      contentStyle={{ ...styles.content, maxWidth: layout.compactContentWidth }}>
      <Card style={[styles.formCard, { gap: spacing.lg }]}>
        <View style={styles.brandRow}>
          <View style={[styles.logoMark, { backgroundColor: colors.accentSoft }]}>
            <Text variant="label" tone="accent">
              M
            </Text>
          </View>
          <Text variant="heading">Melly</Text>
        </View>

        <Text variant="bodySmall" tone="secondary">
          Build your personal music rankings.
        </Text>
        <Text variant="title">Welcome back</Text>

        <View style={[styles.form, { marginTop: spacing.sm }]}>
          <TextField
            placeholder="Email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.rowBetween}>
          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text variant="bodySmall" tone="secondary">
              {isSignUp ? 'Switch to sign in' : 'Create account'}
            </Text>
          </Pressable>
          <Text variant="bodySmall" tone="accent">
            Forgot password
          </Text>
        </View>

        <Button
          title={isSignUp ? 'Sign up' : 'Sign in'}
          onPress={handleEmailAuth}
          disabled={loading}
          loading={loading}
          style={styles.primaryButton}
        />

        <Button
          title="Continue with Spotify"
          onPress={handleSpotifyAuth}
          loading={loading}
          variant="secondary"
          style={styles.secondaryButton}
        />

        <Text variant="bodySmall" tone="secondary" style={styles.centerText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Text variant="bodySmall" tone="accent">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Text>
        </Text>
        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={
              colorScheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radius.md}
            style={[styles.appleButton, { marginTop: spacing.xs }]}
            onPress={handleAppleAuth}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  content: {
    justifyContent: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  formCard: { gap: 16, paddingVertical: 34, paddingHorizontal: 28 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { textAlign: 'center', marginTop: 12 },
  form: {
    gap: 16,
    marginTop: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  primaryButton: { marginTop: 6 },
  secondaryButton: { marginTop: 10 },
  appleButton: {
    width: '100%',
    height: 50,
  },
});
