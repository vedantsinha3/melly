import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithSpotify } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
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
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.logo, { color: colors.text }]}>Melly</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to get
          started.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={[styles.logo, { color: colors.text }]}>Melly</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Rank the songs you love
        </Text>

        <Pressable
          style={[styles.spotifyButton, { backgroundColor: '#1DB954' }]}
          onPress={handleSpotifyAuth}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.spotifyButtonText}>Continue with Spotify</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setShowOtherOptions(!showOtherOptions)}>
          <Text style={[styles.otherOptionsText, { color: colors.textSecondary }]}>
            {showOtherOptions ? 'Hide other sign-in options' : 'Other sign-in options'}
          </Text>
        </Pressable>

        {showOtherOptions ? (
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={handleEmailAuth}
              disabled={loading}>
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {isSignUp ? 'Create account' : 'Sign in with email'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </Text>
            </Pressable>

            {Platform.OS === 'ios' ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  colorScheme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleAuth}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  spotifyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  spotifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  otherOptionsText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
    marginBottom: 8,
  },
  form: {
    gap: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginTop: 8,
  },
});
