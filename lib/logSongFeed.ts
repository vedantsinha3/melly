import {
  getOnRepeatTracks,
  getPlaylistTracksByName,
  getRecentlyAddedTracks,
  getRecentlyPlayed,
  getSavedTracks,
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
};

function filterUnranked(items: SpotifyFeedItem[], rankedTrackIds: Set<string>): SpotifyFeedItem[] {
  return items.filter((item) => !rankedTrackIds.has(item.track.id));
}

async function safeSection(
  loader: () => Promise<SpotifyFeedItem[]>,
): Promise<SpotifyFeedItem[]> {
  try {
    return await loader();
  } catch (error) {
    console.warn('Feed section failed to load', error);
    return [];
  }
}

export async function buildLogSongFeed({
  accessToken,
  rankedTrackIds,
}: BuildFeedOptions): Promise<FeedSection[]> {
  const [
    recentlyPlayed,
    recentlyLiked,
    onRepeat,
    discoverWeekly,
    releaseRadar,
    recentlyAdded,
    topMedium,
  ] = await Promise.all([
    safeSection(() => getRecentlyPlayed(accessToken, 24)),
    safeSection(() => getSavedTracks(accessToken, 24)),
    safeSection(() => getOnRepeatTracks(accessToken, 20)),
    safeSection(() => getPlaylistTracksByName(accessToken, 'Discover Weekly', 20)),
    safeSection(() => getPlaylistTracksByName(accessToken, 'Release Radar', 20)),
    safeSection(() => getRecentlyAddedTracks(accessToken, 20)),
    safeSection(async () => {
      const tracks = await getUserTopTracks(accessToken, 'medium_term' as TopTracksTimeRange);
      return tracks.slice(0, 16).map((track) => ({ track, meta: 'All-time favorite' }));
    }),
  ]);

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

  pushSection('recently_played', 'Recently played', 'Fresh from Spotify', recentlyPlayed);
  pushSection('recently_liked', 'Recently liked', 'Songs you saved on Spotify', recentlyLiked);
  pushSection('on_repeat', 'On repeat', 'Your most-played right now', onRepeat);
  pushSection('discover_weekly', 'Discover Weekly', 'Your latest discoveries', discoverWeekly);
  pushSection('release_radar', 'Release Radar', 'New music worth a spin', releaseRadar);
  pushSection('recently_added', 'Recently added', 'New saves in your library', recentlyAdded);

  if (sections.length === 0) {
    pushSection('top_tracks', 'Ready to rank', 'Start with songs you already love', topMedium);
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
