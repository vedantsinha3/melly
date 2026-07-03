import {
  findPlaylistIdInList,
  getLibraryTracks,
  getPlaylistTracks,
  getRecentlyPlayed,
  getUserPlaylists,
  type LibraryTracksBundle,
  type SpotifyFeedItem,
} from '@/lib/spotifyUser';
import { getUserTopTracks } from '@/lib/spotify';
import type { SpotifySearchTrack, TopTracksTimeRange } from '@/types';

export type FeedSection = {
  id: string;
  title: string;
  subtitle: string;
  tracks: SpotifyFeedItem[];
};

type BuildFeedOptions = {
  accessToken: string;
  rankedTrackIds: Set<string>;
  forceRefresh?: boolean;
};

type RawFeedData = {
  recentlyPlayed: SpotifyFeedItem[];
  library: LibraryTracksBundle;
  topShort: SpotifySearchTrack[];
  discoverWeekly: SpotifyFeedItem[];
  releaseRadar: SpotifyFeedItem[];
};

const FEED_RAW_CACHE_TTL_MS = 5 * 60 * 1000;

let rawFeedCache: { key: string; expiresAt: number; data: RawFeedData } | null = null;

export function invalidateLogSongFeedCache(): void {
  rawFeedCache = null;
}

function filterUnranked(items: SpotifyFeedItem[], rankedTrackIds: Set<string>): SpotifyFeedItem[] {
  return items.filter((item) => !rankedTrackIds.has(item.track.id));
}

async function safeSection<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    console.warn('Feed section failed to load', error);
    return fallback;
  }
}

const EMPTY_LIBRARY: LibraryTracksBundle = { saved: [], recentlyAdded: [] };

async function fetchRawFeedData(accessToken: string, forceRefresh: boolean): Promise<RawFeedData> {
  const cacheKey = accessToken.slice(0, 8);
  if (
    !forceRefresh &&
    rawFeedCache &&
    rawFeedCache.key === cacheKey &&
    Date.now() < rawFeedCache.expiresAt
  ) {
    return rawFeedCache.data;
  }

  const [recentlyPlayed, library, topShort, playlists] = await Promise.all([
    safeSection(() => getRecentlyPlayed(accessToken, 24), []),
    safeSection(() => getLibraryTracks(accessToken, 24), EMPTY_LIBRARY),
    safeSection(() => getUserTopTracks(accessToken, 'short_term', 20), []),
    safeSection(() => getUserPlaylists(accessToken), []),
  ]);

  const discoverId = findPlaylistIdInList(playlists, 'Discover Weekly');
  const releaseRadarId = findPlaylistIdInList(playlists, 'Release Radar');

  const [discoverWeekly, releaseRadar] = await Promise.all([
    discoverId
      ? safeSection(() => getPlaylistTracks(accessToken, discoverId, 20), [])
      : Promise.resolve([]),
    releaseRadarId
      ? safeSection(() => getPlaylistTracks(accessToken, releaseRadarId, 20), [])
      : Promise.resolve([]),
  ]);

  const data: RawFeedData = {
    recentlyPlayed,
    library,
    topShort,
    discoverWeekly,
    releaseRadar,
  };

  rawFeedCache = {
    key: cacheKey,
    expiresAt: Date.now() + FEED_RAW_CACHE_TTL_MS,
    data,
  };

  return data;
}

function buildSectionsFromRaw(raw: RawFeedData, rankedTrackIds: Set<string>): FeedSection[] {
  const sections: FeedSection[] = [];

  const pushSection = (
    id: string,
    title: string,
    subtitle: string,
    items: SpotifyFeedItem[],
  ) => {
    const tracks = filterUnranked(items, rankedTrackIds).slice(0, 12);
    if (tracks.length > 0) {
      sections.push({ id, title, subtitle, tracks });
    }
  };

  const onRepeat = raw.topShort.map((track) => ({
    track,
    meta: 'On repeat lately',
  }));

  pushSection('recently_played', 'Recently played', 'Fresh from Spotify', raw.recentlyPlayed);
  pushSection('recently_liked', 'Recently liked', 'Songs you saved on Spotify', raw.library.saved);
  pushSection('on_repeat', 'On repeat', 'Your most-played right now', onRepeat);
  pushSection('discover_weekly', 'Discover Weekly', 'Your latest discoveries', raw.discoverWeekly);
  pushSection('release_radar', 'Release Radar', 'New music worth a spin', raw.releaseRadar);
  pushSection('recently_added', 'Recently added', 'New saves in your library', raw.library.recentlyAdded);

  return sections;
}

export async function buildLogSongFeed({
  accessToken,
  rankedTrackIds,
  forceRefresh = false,
}: BuildFeedOptions): Promise<FeedSection[]> {
  const raw = await fetchRawFeedData(accessToken, forceRefresh);
  const sections = buildSectionsFromRaw(raw, rankedTrackIds);

  if (sections.length > 0) {
    return sections;
  }

  const topMedium = await safeSection(async () => {
    const tracks = await getUserTopTracks(accessToken, 'medium_term' as TopTracksTimeRange, 16);
    return tracks.map((track) => ({ track, meta: 'All-time favorite' }));
  }, []);

  const fallbackTracks = filterUnranked(topMedium, rankedTrackIds).slice(0, 12);
  if (fallbackTracks.length > 0) {
    sections.push({
      id: 'top_tracks',
      title: 'Ready to rank',
      subtitle: 'Start with songs you already love',
      tracks: fallbackTracks,
    });
  }

  return sections;
}

export function buildRankingProgress(rankedCount: number): {
  headline: string;
  subline: string;
  completionPct: number;
} {
  const targetForProfile = 50;
  const completionPct = Math.min(100, Math.round((rankedCount / targetForProfile) * 100));
  const remainingForAnalytics = Math.max(0, 30 - rankedCount);

  let subline = 'Keep going to improve your taste profile.';
  if (rankedCount < 5) {
    subline = 'Rank a few more songs to unlock your taste profile.';
  } else if (remainingForAnalytics > 0) {
    subline = `Rank ${remainingForAnalytics} more song${remainingForAnalytics === 1 ? '' : 's'} to unlock deeper analytics.`;
  } else if (completionPct < 100) {
    subline = `Your music profile is ${completionPct}% complete.`;
  } else {
    subline = 'Your taste profile is well underway — keep the momentum going.';
  }

  return {
    headline: rankedCount === 0 ? 'Start your ranking journey' : `You've ranked ${rankedCount} songs`,
    subline,
    completionPct,
  };
}

export function pickNextSuggestion(
  sections: FeedSection[],
  rankedTrackIds: Set<string>,
): string | null {
  for (const section of sections) {
    if (section.id === 'continue') continue;
    for (const item of section.tracks) {
      if (!rankedTrackIds.has(item.track.id)) {
        return item.track.id;
      }
    }
  }
  return null;
}
