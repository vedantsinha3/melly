import { spotifyGetJson } from '@/lib/spotifyFetch';
import type { SpotifySearchTrack } from '@/types';

export type SpotifyFeedItem = {
  track: SpotifySearchTrack;
  meta?: string;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
};

type CacheEntry<T> = { expiresAt: number; value: T };

const PLAYLIST_CACHE_TTL_MS = 10 * 60 * 1000;
const playlistCache = new Map<string, CacheEntry<SpotifyPlaylist[]>>();

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = cache.get(key);
  if (!hit || Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs = PLAYLIST_CACHE_TTL_MS,
): void {
  cache.set(key, { expiresAt: Date.now() + ttlMs, value });
}

function formatPlayedMeta(playedAt: string): string {
  const played = new Date(playedAt);
  const now = new Date();
  const diffMs = now.getTime() - played.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Played today';
  if (diffHours < 24) return `Played ${diffHours}h ago`;
  if (diffHours < 48) return 'Played yesterday';
  return `Played ${played.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function formatAddedMeta(addedAt: string): string {
  const added = new Date(addedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Added today';
  if (diffDays === 1) return 'Added yesterday';
  if (diffDays < 7) return `Added ${diffDays}d ago`;
  return `Added ${added.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function dedupeFeedItems(items: SpotifyFeedItem[]): SpotifyFeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.track.id)) return false;
    seen.add(item.track.id);
    return true;
  });
}

export type LibraryTracksBundle = {
  saved: SpotifyFeedItem[];
  recentlyAdded: SpotifyFeedItem[];
};

export async function getRecentlyPlayed(
  accessToken: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const data = await spotifyGetJson<{
    items: Array<{ played_at: string; track: SpotifySearchTrack }>;
  }>(accessToken, `/me/player/recently-played?limit=${limit}`);

  return dedupeFeedItems(
    data.items
      .filter((item) => item.track?.id)
      .map((item) => ({
        track: item.track,
        meta: formatPlayedMeta(item.played_at),
      })),
  );
}

export async function getLibraryTracks(
  accessToken: string,
  limit = 20,
): Promise<LibraryTracksBundle> {
  const data = await spotifyGetJson<{
    items: Array<{ added_at: string; track: SpotifySearchTrack }>;
  }>(accessToken, `/me/tracks?limit=${limit}`);

  const items = data.items.filter((item) => item.track?.id);

  return {
    saved: dedupeFeedItems(
      items.map((item) => ({
        track: item.track,
        meta: 'Liked on Spotify',
      })),
    ),
    recentlyAdded: dedupeFeedItems(
      items.map((item) => ({
        track: item.track,
        meta: formatAddedMeta(item.added_at),
      })),
    ),
  };
}

export async function getSavedTracks(accessToken: string, limit = 20): Promise<SpotifyFeedItem[]> {
  const bundle = await getLibraryTracks(accessToken, limit);
  return bundle.saved;
}

export async function getRecentlyAddedTracks(
  accessToken: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const bundle = await getLibraryTracks(accessToken, limit);
  return bundle.recentlyAdded;
}

type SpotifyPlaylistPage = {
  items: SpotifyPlaylist[];
  next: string | null;
};

export async function getUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
  const cacheKey = accessToken.slice(0, 8);
  const cached = readCache(playlistCache, cacheKey);
  if (cached) return cached;

  const playlists: SpotifyPlaylist[] = [];
  let path: string | null = '/me/playlists?limit=50';

  while (path) {
    const page: SpotifyPlaylistPage = await spotifyGetJson<SpotifyPlaylistPage>(accessToken, path);

    playlists.push(...page.items);
    path = page.next ? page.next.replace('https://api.spotify.com/v1', '') : null;
  }

  writeCache(playlistCache, cacheKey, playlists);
  return playlists;
}

export function findPlaylistIdInList(
  playlists: SpotifyPlaylist[],
  name: string,
): string | null {
  const needle = name.toLowerCase();
  const match = playlists.find((playlist) => playlist.name.toLowerCase().includes(needle));
  return match?.id ?? null;
}

export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const data = await spotifyGetJson<{
    items: Array<{ track: SpotifySearchTrack | null }>;
  }>(accessToken, `/playlists/${playlistId}/tracks?limit=${limit}`);

  return dedupeFeedItems(
    data.items
      .filter((item) => item.track?.id)
      .map((item) => ({
        track: item.track as SpotifySearchTrack,
        meta: 'Fresh from Spotify',
      })),
  );
}

export async function getPlaylistTracksByName(
  accessToken: string,
  playlistName: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const playlists = await getUserPlaylists(accessToken);
  const playlistId = findPlaylistIdInList(playlists, playlistName);
  if (!playlistId) return [];

  return getPlaylistTracks(accessToken, playlistId, limit);
}

export async function getOnRepeatTracks(
  accessToken: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const { getUserTopTracks } = await import('./spotify');
  const tracks = await getUserTopTracks(accessToken, 'short_term');
  return tracks.slice(0, limit).map((track) => ({
    track,
    meta: 'On repeat lately',
  }));
}
