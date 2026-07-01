import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert, Platform } from 'react-native';

import {
  clearOAuthCallbackFromUrl,
  createSessionFromOAuthUrl,
  formatSpotifyOAuthError,
  isOAuthCallbackUrl,
  isSpotifyEmailVerificationCallback,
  startSpotifyOAuth,
} from '@/lib/oauth';
import { confirmDestructive } from '@/lib/confirm';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSpotifyUser: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithSpotify: () => Promise<void>;
  getSpotifyAccessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  requestSignOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isSpotifySession(session: Session | null): boolean {
  if (!session) return false;
  if (session.provider_token) return true;
  return session.user.identities?.some((identity) => identity.provider === 'spotify') ?? false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setSpotifyAccessToken(currentSession?.provider_token ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setSpotifyAccessToken((currentToken) => {
        if (event === 'SIGNED_OUT' || !newSession) return null;
        return newSession.provider_token ?? currentToken;
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handleOAuthCallback = async (url: string) => {
      if (!isOAuthCallbackUrl(url)) return;

      if (isSpotifyEmailVerificationCallback(url)) {
        clearOAuthCallbackFromUrl();
        Alert.alert('Confirm your email', formatSpotifyOAuthError('unverified email'));
        return;
      }

      try {
        const newSession = await createSessionFromOAuthUrl(url);
        if (newSession) {
          setSession(newSession);
          setSpotifyAccessToken(newSession.provider_token ?? null);
          clearOAuthCallbackFromUrl();
          return;
        }
      } catch (error) {
        clearOAuthCallbackFromUrl();
        const message = error instanceof Error ? error.message : 'Spotify sign-in failed';
        Alert.alert('Sign-in failed', formatSpotifyOAuthError(message));
        console.error('OAuth callback error:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && isOAuthCallbackUrl(window.location.href)) {
        handleOAuthCallback(window.location.href);
      }
      return;
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleOAuthCallback(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleOAuthCallback(url);
    });

    return () => subscription.remove();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const nonce = Math.random().toString(36).substring(2, 10);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('No identity token from Apple');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce,
    });

    if (error) throw error;
  };

  const signInWithSpotify = async () => {
    await startSpotifyOAuth();
  };

  const getSpotifyAccessToken = async (): Promise<string | null> => {
    if (spotifyAccessToken) {
      return spotifyAccessToken;
    }

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.provider_token) {
      setSpotifyAccessToken(currentSession.provider_token);
      return currentSession.provider_token;
    }

    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    const refreshedProviderToken = refreshedSession?.provider_token ?? null;
    setSpotifyAccessToken(refreshedProviderToken);
    return refreshedProviderToken;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      const { error: localError } = await supabase.auth.signOut({ scope: 'local' });
      if (localError) throw localError;
    }

    setSession(null);
    setSpotifyAccessToken(null);
  };

  const requestSignOut = () => {
    confirmDestructive('Sign out', 'Are you sure you want to sign out?', 'Sign out', signOut);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        isSpotifyUser: isSpotifySession(session),
        signInWithEmail,
        signUpWithEmail,
        signInWithApple,
        signInWithSpotify,
        getSpotifyAccessToken,
        signOut,
        requestSignOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
