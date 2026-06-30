import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'melly' });

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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const { access_token, refresh_token } = params;

  if (!access_token) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return data.session;
}

function isSpotifySession(session: Session | null): boolean {
  if (!session) return false;
  if (session.provider_token) return true;
  return session.user.identities?.some((identity) => identity.provider === 'spotify') ?? false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: 'user-top-read user-read-email',
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned from Supabase');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success') {
      await createSessionFromUrl(result.url);
      return;
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Spotify sign-in was cancelled');
    }
  };

  const getSpotifyAccessToken = async (): Promise<string | null> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.provider_token) {
      return currentSession.provider_token;
    }

    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    return refreshedSession?.provider_token ?? null;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
