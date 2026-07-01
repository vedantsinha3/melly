import { supabase } from './supabase';
import type { SpotifySearchTrack, TopTracksTimeRange, Track } from '@/types';

let cachedToken: { token: string; expiresAt: number } | null = null;

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

export function spotifyTrackToTrack(item: SpotifySearchTrack): Track {
  return {
    spotify_id: item.id,
    name: item.name,
    artist_names: item.artists.map((a) => a.name),
    album_name: item.album.name,
    album_art_url: item.album.images[0]?.url ?? null,
    duration_ms: item.duration_ms,
    preview_url: item.preview_url,
    genre: null,
  };
}

async function getClientCredentialsToken(): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Spotify credentials not configured. Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID and EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET in .env',
    );
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = base64Encode(`${clientId}:${clientSecret}`);
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify auth failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

async function searchViaEdgeFunction(query: string): Promise<SpotifySearchTrack[]> {
  const { data, error } = await supabase.functions.invoke('spotify-search', {
    body: { query },
  });

  if (error) throw error;
  return data.tracks as SpotifySearchTrack[];
}

function buildSearchUrl(query: string): string {
  return `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track`;
}

async function searchViaClientCredentials(query: string): Promise<SpotifySearchTrack[]> {
  const token = await getClientCredentialsToken();

  const response = await fetch(buildSearchUrl(query), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify search failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.tracks.items as SpotifySearchTrack[];
}

export async function searchTracks(query: string): Promise<SpotifySearchTrack[]> {
  if (!query.trim()) return [];

  // Use client credentials directly for local dev; edge function is optional.
  try {
    return await searchViaClientCredentials(query);
  } catch (clientError) {
    try {
      return await searchViaEdgeFunction(query);
    } catch {
      throw clientError;
    }
  }
}

export async function getUserTopTracks(
  accessToken: string,
  timeRange: TopTracksTimeRange,
  limit = 50,
): Promise<SpotifySearchTrack[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify top tracks failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.items as SpotifySearchTrack[];
}

export async function upsertTrack(track: Track): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from('tracks')
    .select('spotify_id')
    .eq('spotify_id', track.spotify_id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return;

  const { error: insertError } = await supabase.from('tracks').insert(track);
  if (insertError) {
    const message = insertError.message.toLowerCase();
    if (message.includes('duplicate key')) {
      // Another client inserted first; treat as success.
      return;
    }
    throw insertError;
  }
}
