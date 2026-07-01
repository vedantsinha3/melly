import type { SpotifySearchTrack } from '@/types';

export type SpotifyFeedItem = {
  track: SpotifySearchTrack;
  meta?: string;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
};

async function spotifyGet<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify API failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
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

export async function getRecentlyPlayed(
  accessToken: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const data = await spotifyGet<{
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

export async function getSavedTracks(accessToken: string, limit = 20): Promise<SpotifyFeedItem[]> {
  const data = await spotifyGet<{
    items: Array<{ added_at: string; track: SpotifySearchTrack }>;
  }>(accessToken, `/me/tracks?limit=${limit}`);

  return dedupeFeedItems(
    data.items
      .filter((item) => item.track?.id)
      .map((item) => ({
        track: item.track,
        meta: 'Liked on Spotify',
      })),
  );
}

export async function getRecentlyAddedTracks(
  accessToken: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const data = await spotifyGet<{
    items: Array<{ added_at: string; track: SpotifySearchTrack }>;
  }>(accessToken, `/me/tracks?limit=${limit}`);

  return dedupeFeedItems(
    data.items
      .filter((item) => item.track?.id)
      .map((item) => ({
        track: item.track,
        meta: formatAddedMeta(item.added_at),
      })),
  );
}

async function findPlaylistId(accessToken: string, name: string): Promise<string | null> {
  let path: string | null = '/me/playlists?limit=50';

  while (path) {
    const data: {
      items: SpotifyPlaylist[];
      next: string | null;
    } = await spotifyGet(accessToken, path);

    const match = data.items.find((playlist: SpotifyPlaylist) =>
      playlist.name.toLowerCase().includes(name.toLowerCase()),
    );
    if (match) return match.id;

    path = data.next ? data.next.replace('https://api.spotify.com/v1', '') : null;
  }

  return null;
}

export async function getPlaylistTracksByName(
  accessToken: string,
  playlistName: string,
  limit = 20,
): Promise<SpotifyFeedItem[]> {
  const playlistId = await findPlaylistId(accessToken, playlistName);
  if (!playlistId) return [];

  const data = await spotifyGet<{
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
