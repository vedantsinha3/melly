import { supabase } from './supabase';
import type { SpotifyAlbumTrack, SpotifySearchTrack, TopTracksTimeRange, Track } from '@/types';

let cachedToken: { token: string; expiresAt: number } | null = null;

const SPOTIFY_CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry<T> = { expiresAt: number; value: T };

const albumTracksCache = new Map<string, CacheEntry<SpotifyAlbumTrack[]>>();
const trackByIdCache = new Map<string, CacheEntry<SpotifySearchTrack>>();
const artistImageCache = new Map<string, CacheEntry<string | null>>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function spotifyFetch(accessToken: string, url: string): Promise<Response> {
  let delayMs = 1000;

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status !== 429) return response;
    if (attempt === 3) return response;

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : delayMs;
    await sleep(Number.isFinite(retryAfterMs) && retryAfterMs > 0 ? retryAfterMs : delayMs);
    delayMs = Math.min(delayMs * 2, 8000);
  }

  throw new Error('Spotify request failed');
}

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = cache.get(key);
  if (!hit || Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
  cache.set(key, { expiresAt: Date.now() + SPOTIFY_CACHE_TTL_MS, value });
}

function normalizeArtistKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
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

export function spotifyTrackToTrack(item: SpotifySearchTrack): Track {
  return {
    spotify_id: item.id,
    name: item.name,
    artist_names: item.artists.map((a) => a.name),
    album_name: item.album.name,
    album_art_url: item.album.images[0]?.url ?? null,
    album_id: item.album.id ?? null,
    album_type: item.album.album_type ?? null,
    album_release_date: item.album.release_date ?? null,
    album_total_tracks: item.album.total_tracks ?? null,
    track_number: item.track_number ?? null,
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

export async function getSpotifyArtistImageUrl(artistName: string): Promise<string | null> {
  const key = normalizeArtistKey(artistName);
  if (!key) return null;

  const cached = readCache(artistImageCache, key);
  if (cached !== null) return cached;

  try {
    const token = await getClientCredentialsToken();
    const query = encodeURIComponent(artistName.trim());
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      writeCache(artistImageCache, key, null);
      return null;
    }

    const data = (await response.json()) as {
      artists?: { items?: Array<{ images?: Array<{ url: string }> }> };
    };

    const url = data.artists?.items?.[0]?.images?.[0]?.url ?? null;
    writeCache(artistImageCache, key, url);
    return url;
  } catch {
    writeCache(artistImageCache, key, null);
    return null;
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

export async function getTrackById(accessToken: string, trackId: string): Promise<SpotifySearchTrack> {
  const cacheKey = `${accessToken.slice(0, 8)}:${trackId}`;
  const cached = readCache(trackByIdCache, cacheKey);
  if (cached) return cached;

  const response = await spotifyFetch(accessToken, `https://api.spotify.com/v1/tracks/${trackId}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify track lookup failed (${response.status}): ${body}`);
  }

  const track = (await response.json()) as SpotifySearchTrack;
  writeCache(trackByIdCache, cacheKey, track);
  return track;
}

export async function getSpotifyReadToken(
  getUserToken?: () => Promise<string | null>,
): Promise<string> {
  if (getUserToken) {
    const userToken = await getUserToken();
    if (userToken) return userToken;
  }

  return getClientCredentialsToken();
}

export async function searchSpotifyAlbumId(
  accessToken: string,
  albumName: string,
  artistName: string,
): Promise<string | null> {
  const query = encodeURIComponent(`album:${albumName} artist:${artistName}`);
  const response = await spotifyFetch(
    accessToken,
    `https://api.spotify.com/v1/search?q=${query}&type=album&limit=5`,
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    albums?: { items?: Array<{ id: string; name: string }> };
  };
  const items = data.albums?.items ?? [];
  if (items.length === 0) return null;

  const normalizedAlbum = albumName.trim().toLowerCase();
  const exact = items.find((item) => item.name.trim().toLowerCase() === normalizedAlbum);
  return exact?.id ?? items[0]?.id ?? null;
}

export async function resolveSpotifyAlbumId(
  accessToken: string,
  albumId: string | null | undefined,
  rankedTrackIds: string[],
  albumName: string,
  artistName: string,
): Promise<string | null> {
  if (albumId?.trim()) return albumId;

  const firstTrackId = rankedTrackIds[0];
  if (firstTrackId) {
    try {
      const track = await getTrackById(accessToken, firstTrackId);
      if (track.album.id?.trim()) return track.album.id;
    } catch {
      // Fall through to album search.
    }
  }

  return searchSpotifyAlbumId(accessToken, albumName, artistName);
}

export async function getAlbumTracks(accessToken: string, albumId: string): Promise<SpotifyAlbumTrack[]> {
  const cacheKey = `${accessToken.slice(0, 8)}:${albumId}`;
  const cached = readCache(albumTracksCache, cacheKey);
  if (cached) return cached;

  const tracks: SpotifyAlbumTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const response = await spotifyFetch(accessToken, nextUrl);

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) {
        throw new Error('Spotify is rate limiting requests. Try again in a moment.');
      }
      throw new Error(`Spotify album tracks failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      items: Array<{
        id: string;
        name: string;
        track_number: number;
        duration_ms: number;
        artists?: { name: string }[];
      }>;
      next: string | null;
    };

    tracks.push(
      ...payload.items
        .filter((item) => Boolean(item.id))
        .map((item) => ({
          id: item.id,
          name: item.name,
          track_number: item.track_number,
          duration_ms: item.duration_ms,
          artists: item.artists,
        })),
    );
    nextUrl = payload.next;
  }

  writeCache(albumTracksCache, cacheKey, tracks);
  return tracks;
}

function baseTrackPayload(track: Track) {
  return {
    spotify_id: track.spotify_id,
    name: track.name,
    artist_names: track.artist_names,
    album_name: track.album_name,
    album_art_url: track.album_art_url,
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    genre: track.genre,
  };
}

function metadataPatch(track: Track): Partial<Track> {
  const patch: Partial<Track> = {};
  if (track.album_id) patch.album_id = track.album_id;
  if (track.album_type) patch.album_type = track.album_type;
  if (track.album_release_date) patch.album_release_date = track.album_release_date;
  if (track.album_total_tracks) patch.album_total_tracks = track.album_total_tracks;
  if (track.track_number) patch.track_number = track.track_number;
  return patch;
}

async function patchTrackMetadataIfSupported(spotifyId: string, track: Track): Promise<void> {
  const patch = metadataPatch(track);
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from('tracks').update(patch).eq('spotify_id', spotifyId);
  if (error) {
    // Album metadata columns require migration 002_tracks_album_metadata.sql.
    console.warn('Track metadata patch skipped:', error.message);
  }
}

export async function upsertTrack(track: Track): Promise<void> {
  const { data: existing, error: lookupError } = await supabase
    .from('tracks')
    .select('spotify_id')
    .eq('spotify_id', track.spotify_id)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) {
    await patchTrackMetadataIfSupported(track.spotify_id, track);
    return;
  }

  const { error: insertError } = await supabase.from('tracks').insert(baseTrackPayload(track));
  if (insertError) {
    const message = insertError.message.toLowerCase();
    if (message.includes('duplicate key')) {
      // Another client inserted first; treat as success.
      return;
    }
    throw insertError;
  }

  await patchTrackMetadataIfSupported(track.spotify_id, track);
}
