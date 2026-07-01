import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'melly',
    path: 'auth/callback',
  });
}

export async function createSessionFromOAuthUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  const {
    access_token,
    refresh_token,
    provider_token,
    provider_refresh_token,
    error,
    error_description,
  } = params;

  if (error) {
    throw new Error(error_description ?? error);
  }

  if (!access_token) {
    return null;
  }

  const { data, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (sessionError) throw sessionError;
  return data.session
    ? {
        ...data.session,
        provider_token,
        provider_refresh_token,
      }
    : null;
}

export function formatSpotifyOAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('unverified email')) {
    return (
      'Spotify sign-in needs one more step.\n\n' +
      'Check the email address on your Spotify account for a confirmation email from Supabase, then click the confirmation link.\n\n' +
      'If no email arrives, check your Supabase Auth email delivery settings or temporarily disable email confirmations while testing locally.'
    );
  }

  return message;
}

export function isSpotifyEmailVerificationCallback(url: string): boolean {
  return url.toLowerCase().includes('unverified') && url.includes('error');
}

export function isOAuthCallbackUrl(url: string): boolean {
  return url.includes('access_token=') || url.includes('error=') || url.includes('errorCode=');
}

export async function startSpotifyOAuth(): Promise<void> {
  const redirectTo = getOAuthRedirectUri();

  if (__DEV__) {
    console.log('[Melly] OAuth redirect URI:', redirectTo);
  }

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

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error('Browser environment not available');
    }
    window.location.assign(data.url);
    return;
  }

  const WebBrowser = await import('expo-web-browser');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success') {
    const session = await createSessionFromOAuthUrl(result.url);
    if (!session) {
      throw new Error('Failed to complete Spotify sign-in. Check Supabase redirect URLs.');
    }
    return;
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Spotify sign-in was cancelled');
  }

  throw new Error('Spotify sign-in failed');
}

export function clearOAuthCallbackFromUrl(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, '', window.location.pathname);
  }
}
