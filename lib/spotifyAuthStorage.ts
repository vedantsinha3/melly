import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'melly_spotify_access_token';
const REFRESH_TOKEN_KEY = 'melly_spotify_refresh_token';
const EXPIRES_AT_KEY = 'melly_spotify_expires_at';

type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
};

async function readStoredTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    AsyncStorage.getItem(ACCESS_TOKEN_KEY),
    AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    AsyncStorage.getItem(EXPIRES_AT_KEY),
  ]);

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : 0,
  };
}

function base64Encode(value: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(value);
  }

  const bytes = new TextEncoder().encode(value);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;
    const b3 = bytes[i + 2] ?? 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }

  return result;
}

async function refreshSpotifyAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Spotify client credentials missing — cannot refresh provider token');
    return null;
  }

  const credentials = base64Encode(`${clientId}:${clientSecret}`);
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    console.warn('Spotify token refresh failed', await response.text());
    return null;
  }

  const data = await response.json();
  if (!data.access_token) return null;

  await saveSpotifyTokens(data.access_token, data.refresh_token ?? refreshToken, data.expires_in ?? 3600);
  return data.access_token as string;
}

export async function saveSpotifyTokens(
  accessToken: string,
  refreshToken?: string | null,
  expiresIn = 3600,
): Promise<void> {
  const expiresAt = Date.now() + expiresIn * 1000;
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearSpotifyTokens(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(EXPIRES_AT_KEY),
  ]);
}

export async function getStoredSpotifyAccessToken(): Promise<string | null> {
  const stored = await readStoredTokens();
  if (!stored) return null;

  const stillValid = stored.expiresAt > Date.now() + 60_000;
  if (stillValid) return stored.accessToken;

  if (stored.refreshToken) {
    return refreshSpotifyAccessToken(stored.refreshToken);
  }

  return null;
}

export async function hydrateSpotifyTokensFromSession(session: {
  provider_token?: string | null;
  provider_refresh_token?: string | null;
} | null): Promise<string | null> {
  if (!session?.provider_token) {
    return getStoredSpotifyAccessToken();
  }

  await saveSpotifyTokens(session.provider_token, session.provider_refresh_token ?? null);
  return session.provider_token;
}
