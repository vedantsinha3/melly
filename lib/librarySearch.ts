import type { RatingWithTrack, SpotifySearchTrack } from '@/types';

const VERSION_SUFFIX_RE =
  /\s*[-–—(]\s*(remaster(?:ed)?(?:\s+\d{4})?|explicit|clean|live|acoustic|version|radio edit|deluxe edition|bonus track|single version|album version).*$/i;

const FEATURED_RE = /\s*[\(\[](?:feat\.?|ft\.?|featuring|with)\s+[^\)\]]+[\)\]]/gi;

export type RankedTrackIndex = {
  bySpotifyId: Map<string, RatingWithTrack>;
  fallbackKeys: Map<string, RatingWithTrack>;
};

export type RankedLibraryMatch = {
  rating: RatingWithTrack;
  score: number;
  matchKind: 'exact' | 'partial';
};

export type SpotifyLibraryMatch = {
  track: SpotifySearchTrack;
  alreadyRanked: boolean;
  matchedRating: RatingWithTrack | null;
};

export type LibrarySearchViewModel = {
  ranked: RankedLibraryMatch[];
  spotify: SpotifyLibraryMatch[];
};

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(FEATURED_RE, '')
    .replace(VERSION_SUFFIX_RE, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTrackTitle(title: string): string {
  return normalizeText(title);
}

export function normalizeArtist(name: string): string {
  const primary = name.split(',')[0] ?? name;
  return normalizeText(primary);
}

export function trackFallbackKey(title: string, artist: string, album?: string): string {
  const parts = [normalizeTrackTitle(title), normalizeArtist(artist)];
  if (album?.trim()) {
    parts.push(normalizeText(album));
  }
  return parts.join('|');
}

export function buildRankedTrackIndex(ratings: RatingWithTrack[]): RankedTrackIndex {
  const bySpotifyId = new Map<string, RatingWithTrack>();
  const fallbackKeys = new Map<string, RatingWithTrack>();

  for (const rating of ratings) {
    bySpotifyId.set(rating.track.spotify_id, rating);

    const withAlbum = trackFallbackKey(
      rating.track.name,
      rating.track.artist_names[0] ?? '',
      rating.track.album_name,
    );
    const withoutAlbum = trackFallbackKey(rating.track.name, rating.track.artist_names[0] ?? '');

    if (!fallbackKeys.has(withAlbum)) fallbackKeys.set(withAlbum, rating);
    if (!fallbackKeys.has(withoutAlbum)) fallbackKeys.set(withoutAlbum, rating);
  }

  return { bySpotifyId, fallbackKeys };
}

function scoreRankedMatch(rating: RatingWithTrack, query: string): number {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeTrackTitle(rating.track.name);
  const artists = rating.track.artist_names.map(normalizeArtist).join(' ');
  const album = normalizeText(rating.track.album_name ?? '');
  const combined = `${title} ${artists} ${album}`;
  const primaryArtist = normalizeArtist(rating.track.artist_names[0] ?? '');
  const titleArtist = `${title} ${primaryArtist}`;

  if (title === normalizedQuery || titleArtist === normalizedQuery) return 100;
  if (title.startsWith(normalizedQuery) || titleArtist.startsWith(normalizedQuery)) return 85;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;

  const allTokensMatch = tokens.every((token) => combined.includes(token));
  if (!allTokensMatch) return 0;

  let score = 45;
  if (title.includes(normalizedQuery)) score += 25;
  if (artists.includes(normalizedQuery)) score += 15;
  if (album.includes(normalizedQuery)) score += 10;

  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    if (artists.includes(token)) score += 3;
    if (album.includes(token)) score += 2;
  }

  return Math.min(score, 95);
}

export function searchRankedLibrary(
  ratings: RatingWithTrack[],
  query: string,
): RankedLibraryMatch[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  return ratings
    .map((rating) => {
      const score = scoreRankedMatch(rating, trimmed);
      if (score <= 0) return null;
      return {
        rating,
        score,
        matchKind: score >= 85 ? ('exact' as const) : ('partial' as const),
      };
    })
    .filter((match): match is RankedLibraryMatch => match !== null)
    .sort((a, b) => b.score - a.score || a.rating.rank_position - b.rating.rank_position);
}

export function findRankedMatch(
  track: Pick<SpotifySearchTrack, 'id' | 'name' | 'artists' | 'album'>,
  index: RankedTrackIndex,
): RatingWithTrack | null {
  const byId = index.bySpotifyId.get(track.id);
  if (byId) return byId;

  const primaryArtist = track.artists[0]?.name ?? '';
  const withAlbum = trackFallbackKey(track.name, primaryArtist, track.album.name);
  const withoutAlbum = trackFallbackKey(track.name, primaryArtist);

  return index.fallbackKeys.get(withAlbum) ?? index.fallbackKeys.get(withoutAlbum) ?? null;
}

export function mapSpotifySearchResults(
  tracks: SpotifySearchTrack[],
  index: RankedTrackIndex,
): SpotifyLibraryMatch[] {
  return tracks.map((track) => {
    const matchedRating = findRankedMatch(track, index);
    return {
      track,
      alreadyRanked: matchedRating !== null,
      matchedRating,
    };
  });
}

export function buildLibrarySearchViewModel(
  ratings: RatingWithTrack[],
  spotifyTracks: SpotifySearchTrack[],
  query: string,
): LibrarySearchViewModel {
  const index = buildRankedTrackIndex(ratings);

  return {
    ranked: searchRankedLibrary(ratings, query),
    spotify: mapSpotifySearchResults(spotifyTracks, index),
  };
}

export type SelectableSearchResult =
  | { kind: 'ranked'; ratingId: string }
  | { kind: 'spotify-rank'; spotifyId: string }
  | { kind: 'spotify-view'; ratingId: string };

export function flattenSearchResults(model: LibrarySearchViewModel): SelectableSearchResult[] {
  const items: SelectableSearchResult[] = [];

  for (const match of model.ranked) {
    items.push({ kind: 'ranked', ratingId: match.rating.id });
  }

  for (const match of model.spotify) {
    if (match.alreadyRanked && match.matchedRating) {
      items.push({ kind: 'spotify-view', ratingId: match.matchedRating.id });
    } else if (!match.alreadyRanked) {
      items.push({ kind: 'spotify-rank', spotifyId: match.track.id });
    }
  }

  return items;
}

export function formatRankedDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
