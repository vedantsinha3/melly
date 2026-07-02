import type { RatingWithTrack } from '@/types';

export type AlbumSortMode =
  | 'favorite'
  | 'most_completed'
  | 'highest_average'
  | 'needs_ranking'
  | 'recently_ranked';

export type AlbumFilterMode = 'all' | 'album' | 'ep';

export type AlbumTypeValue = 'album' | 'ep';

export type AlbumConfidenceLevel = 'low' | 'medium' | 'high';

export type AlbumExploreTier = 'favorite' | 'exploring';

export type AlbumRankedSong = {
  ratingId: string;
  trackId: string;
  title: string;
  score: number;
  rankPosition: number;
  rankedAt: string;
  hasNotes: boolean;
  trackNumber: number | null;
};

export type AlbumSummary = {
  key: string;
  albumId: string | null;
  title: string;
  artist: string;
  artworkUrl: string | null;
  albumType: AlbumTypeValue;
  albumTypeBadge: 'Album' | 'EP';
  releaseYear: string | null;
  averageScore: number;
  adjustedScore: number;
  confidenceMultiplier: number;
  confidenceLevel: AlbumConfidenceLevel;
  confidenceLabel: string;
  rankedCount: number;
  totalTrackCount: number | null;
  completionPct: number | null;
  songsLeft: number | null;
  isComplete: boolean;
  completionStatus: string;
  exploreTier: AlbumExploreTier;
  bestSong: AlbumRankedSong;
  lowestSong: AlbumRankedSong;
  perfectScoreCount: number;
  recentRankedAt: string;
  rankedSongs: AlbumRankedSong[];
};

export type AlbumCollectionStats = {
  completedCount: number;
  exploringCount: number;
  averageAlbumRating: number;
  hoursRanked: number;
  favoriteArtist: string | null;
  mostCompletedArtist: string | null;
};

export type AlbumCatalogViewModel = {
  stats: AlbumCollectionStats;
  featuredAlbum: AlbumSummary | null;
  continueAlbum: AlbumSummary | null;
  favoriteAlbums: AlbumSummary[];
  exploringAlbums: AlbumSummary[];
  sortedAlbums: AlbumSummary[];
};

export type AlbumDetailViewModel = {
  summary: AlbumSummary;
  songsLeftToRank: number | null;
  isComplete: boolean;
  completionMessage: string;
  insights: string[];
  rankAmongAlbums: number;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function buildAlbumKey(track: RatingWithTrack['track']): string {
  const title = normalize(track.album_name);
  const artist = normalize(track.artist_names[0] ?? 'unknown');
  return `name:${title}|artist:${artist}`;
}

export function parseAlbumKey(albumKey: string): { title: string; artist: string } | null {
  const decoded = decodeURIComponent(albumKey).trim();
  const modernMatch = decoded.match(/^name:(.+)\|artist:([^|]+)(?:\|year:.+)?$/);
  if (modernMatch) {
    return { title: modernMatch[1].trim(), artist: modernMatch[2].trim() };
  }
  return null;
}

export function resolveAlbumSummary(albums: AlbumSummary[], albumKey: string): AlbumSummary | null {
  const decodedKey = decodeURIComponent(albumKey).trim();
  const directMatch = albums.find((album) => album.key === decodedKey);
  if (directMatch) return directMatch;

  if (decodedKey.startsWith('id:')) {
    const albumId = decodedKey.slice(3).trim();
    if (albumId) {
      const byId = albums.find((album) => album.albumId === albumId);
      if (byId) return byId;
    }
  }

  const parsed = parseAlbumKey(decodedKey);
  if (parsed) {
    const normalizedTitle = normalize(parsed.title);
    const normalizedArtist = normalize(parsed.artist);
    const byNameArtist = albums.find(
      (album) => normalize(album.title) === normalizedTitle && normalize(album.artist) === normalizedArtist,
    );
    if (byNameArtist) return byNameArtist;
  }

  return null;
}

export function getConfidenceMultiplier(rankedCount: number): number {
  if (rankedCount >= 10) return 1;
  if (rankedCount >= 5) return 0.94;
  if (rankedCount === 4) return 0.91;
  if (rankedCount === 3) return 0.88;
  if (rankedCount === 2) return 0.8;
  if (rankedCount === 1) return 0.7;
  return 0.5;
}

export function getConfidenceLevel(
  rankedCount: number,
  completionPct: number | null,
  isComplete: boolean,
): AlbumConfidenceLevel {
  if (isComplete || rankedCount >= 5 || (completionPct ?? 0) >= 75) return 'high';
  if (rankedCount >= 2 || (completionPct ?? 0) >= 25) return 'medium';
  return 'low';
}

export function getConfidenceLabel(level: AlbumConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    default:
      return 'Low confidence';
  }
}

export function getProgressMilestoneColor(
  completionPct: number | null,
  isComplete: boolean,
  scheme: 'light' | 'dark',
): string {
  const pct = isComplete ? 100 : (completionPct ?? 0);
  if (pct >= 100) return scheme === 'dark' ? '#22C55E' : '#169C46';
  if (pct >= 75) return scheme === 'dark' ? '#4ADE80' : '#15803D';
  if (pct >= 50) return scheme === 'dark' ? '#60A5FA' : '#2563EB';
  if (pct >= 25) return scheme === 'dark' ? '#FBBF24' : '#D97706';
  return scheme === 'dark' ? '#6B7280' : '#9AA1AD';
}

export function getCompletionStatus(
  isComplete: boolean,
  completionPct: number | null,
): string {
  if (isComplete) return '✓ Completed';
  if (completionPct != null && completionPct >= 100) return '100% Complete';
  return '';
}

export function getExploringProgressCopy(album: Pick<AlbumSummary, 'songsLeft' | 'completionPct' | 'isComplete'>): string {
  if (album.isComplete) return '✓ Completed';
  if (album.songsLeft != null && album.songsLeft > 0) {
    const left = `${album.songsLeft} song${album.songsLeft === 1 ? '' : 's'} left`;
    if (album.completionPct != null) return `${left} · ${album.completionPct}% complete`;
    return left;
  }
  if (album.completionPct != null) return `${album.completionPct}% complete`;
  return 'Continue ranking';
}

function favoriteSortScore(album: AlbumSummary): number {
  return album.adjustedScore + (album.isComplete ? 0.4 : 0);
}

function isFavoriteAlbum(album: Pick<AlbumSummary, 'rankedCount' | 'completionPct' | 'isComplete'>): boolean {
  if (album.isComplete) return true;
  if (album.rankedCount >= 3) return true;
  if (album.rankedCount >= 2 && (album.completionPct ?? 0) >= 25) return true;
  return false;
}

function toAlbumType(value?: string | null): AlbumTypeValue {
  if (!value) return 'album';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'ep') return 'ep';
  return 'album';
}

function isEligibleAlbumTrack(track: RatingWithTrack['track']): boolean {
  const kind = track.album_type?.trim().toLowerCase();
  if (kind === 'compilation') return false;
  if (kind === 'single' && track.album_total_tracks === 1) return false;
  return true;
}

function isCatalogAlbum(album: Pick<AlbumSummary, 'totalTrackCount'>): boolean {
  return album.totalTrackCount !== 1;
}

function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1));
}

function toRankedSong(rating: RatingWithTrack): AlbumRankedSong {
  return {
    ratingId: rating.id,
    trackId: rating.track.spotify_id,
    title: rating.track.name,
    score: Number(rating.score),
    rankPosition: rating.rank_position,
    rankedAt: rating.created_at ?? rating.listened_at,
    hasNotes: Boolean(rating.notes?.trim()),
    trackNumber: rating.track.track_number ?? null,
  };
}

function compareAlbumSort(a: AlbumSummary, b: AlbumSummary, mode: AlbumSortMode): number {
  switch (mode) {
    case 'most_completed': {
      const aPct = a.completionPct ?? 0;
      const bPct = b.completionPct ?? 0;
      return bPct - aPct || b.adjustedScore - a.adjustedScore;
    }
    case 'highest_average':
      return b.averageScore - a.averageScore || b.rankedCount - a.rankedCount;
    case 'needs_ranking': {
      const aLeft = a.songsLeft ?? 0;
      const bLeft = b.songsLeft ?? 0;
      const aIncomplete = !a.isComplete;
      const bIncomplete = !b.isComplete;
      if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;
      return bLeft - aLeft || a.completionPct! - b.completionPct! || b.adjustedScore - a.adjustedScore;
    }
    case 'recently_ranked':
      return (
        new Date(b.recentRankedAt).getTime() - new Date(a.recentRankedAt).getTime() ||
        b.adjustedScore - a.adjustedScore
      );
    case 'favorite':
    default:
      return (
        favoriteSortScore(b) - favoriteSortScore(a) ||
        b.rankedCount - a.rankedCount ||
        b.averageScore - a.averageScore
      );
  }
}

function enrichAlbumSummary(
  key: string,
  albumRatings: RatingWithTrack[],
): AlbumSummary {
  const representative = albumRatings[0];
  const rankedSongs = albumRatings.map(toRankedSong);
  const scores = rankedSongs.map((song) => song.score);
  const averageScore = average(scores);
  const bestSong = [...rankedSongs].sort((a, b) => b.score - a.score || a.rankPosition - b.rankPosition)[0];
  const lowestSong = [...rankedSongs].sort((a, b) => a.score - b.score || a.rankPosition - b.rankPosition)[0];
  const albumType = toAlbumType(representative.track.album_type);
  const totalTrackCount = representative.track.album_total_tracks ?? null;
  const rankedCount = rankedSongs.length;
  const completionPct =
    totalTrackCount && totalTrackCount > 0
      ? Math.min(100, Math.round((rankedCount / totalTrackCount) * 100))
      : null;
  const isComplete = Boolean(totalTrackCount && rankedCount >= totalTrackCount);
  const songsLeft =
    totalTrackCount && totalTrackCount > rankedCount ? totalTrackCount - rankedCount : isComplete ? 0 : null;
  const confidenceMultiplier = getConfidenceMultiplier(rankedCount);
  const adjustedScore = Number((averageScore * confidenceMultiplier).toFixed(2));
  const confidenceLevel = getConfidenceLevel(rankedCount, completionPct, isComplete);
  const completionStatus = getCompletionStatus(isComplete, completionPct);

  const base = {
    key,
    albumId: representative.track.album_id ?? null,
    title: representative.track.album_name,
    artist: representative.track.artist_names[0] ?? 'Unknown artist',
    artworkUrl: representative.track.album_art_url,
    albumType,
    albumTypeBadge: albumType === 'ep' ? 'EP' : 'Album',
    releaseYear: representative.track.album_release_date?.slice(0, 4) ?? null,
    averageScore,
    adjustedScore,
    confidenceMultiplier,
    confidenceLevel,
    confidenceLabel: getConfidenceLabel(confidenceLevel),
    rankedCount,
    totalTrackCount,
    completionPct,
    songsLeft,
    isComplete,
    completionStatus,
    bestSong,
    lowestSong,
    perfectScoreCount: rankedSongs.filter((song) => song.score >= 9.95).length,
    recentRankedAt: [...rankedSongs]
      .sort((a, b) => new Date(b.rankedAt).getTime() - new Date(a.rankedAt).getTime())[0].rankedAt,
    rankedSongs,
  } satisfies Omit<AlbumSummary, 'exploreTier'>;

  return {
    ...base,
    exploreTier: isFavoriteAlbum(base) ? 'favorite' : 'exploring',
  };
}

export function buildAlbumSummaries(
  ratings: RatingWithTrack[],
  sortMode: AlbumSortMode = 'favorite',
  filterMode: AlbumFilterMode = 'all',
  options?: { catalogOnly?: boolean },
): AlbumSummary[] {
  const grouped = new Map<string, RatingWithTrack[]>();

  for (const rating of ratings) {
    if (!isEligibleAlbumTrack(rating.track)) continue;
    const key = buildAlbumKey(rating.track);
    const list = grouped.get(key) ?? [];
    list.push(rating);
    grouped.set(key, list);
  }

  const albums = [...grouped.entries()].map(([key, albumRatings]) => enrichAlbumSummary(key, albumRatings));

  const filtered = albums.filter((album) => {
    if (options?.catalogOnly && !isCatalogAlbum(album)) return false;
    return filterMode === 'all' ? true : filterMode === 'album' ? album.albumType === 'album' : album.albumType === 'ep';
  });

  return filtered.sort((a, b) => compareAlbumSort(a, b, sortMode));
}

export function buildAlbumCollectionStats(
  albums: AlbumSummary[],
  ratings: RatingWithTrack[],
): AlbumCollectionStats {
  const completedCount = albums.filter((album) => album.isComplete).length;
  const exploringCount = albums.filter((album) => !album.isComplete).length;
  const averageAlbumRating =
    albums.length === 0
      ? 0
      : Number((albums.reduce((sum, album) => sum + album.averageScore, 0) / albums.length).toFixed(1));

  const albumKeys = new Set(albums.map((album) => album.key));
  const msRanked = ratings
    .filter((rating) => albumKeys.has(buildAlbumKey(rating.track)))
    .reduce((sum, rating) => sum + (rating.track.duration_ms ?? 0), 0);

  const artistCounts = new Map<string, number>();
  const artistCompleted = new Map<string, number>();
  for (const album of albums) {
    artistCounts.set(album.artist, (artistCounts.get(album.artist) ?? 0) + 1);
    if (album.isComplete) {
      artistCompleted.set(album.artist, (artistCompleted.get(album.artist) ?? 0) + 1);
    }
  }

  const favoriteArtist =
    [...artistCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
  const mostCompletedArtist =
    [...artistCompleted.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return {
    completedCount,
    exploringCount,
    averageAlbumRating,
    hoursRanked: Number((msRanked / 3_600_000).toFixed(1)),
    favoriteArtist,
    mostCompletedArtist,
  };
}

function pickContinueAlbum(albums: AlbumSummary[]): AlbumSummary | null {
  const candidates = albums
    .filter((album) => !album.isComplete && (album.songsLeft ?? 0) > 0)
    .sort((a, b) => {
      const aPct = a.completionPct ?? 0;
      const bPct = b.completionPct ?? 0;
      if (bPct !== aPct) return bPct - aPct;
      return (a.songsLeft ?? 999) - (b.songsLeft ?? 999);
    });
  return candidates[0] ?? null;
}

export function buildAlbumCatalog(
  ratings: RatingWithTrack[],
  sortMode: AlbumSortMode = 'favorite',
  filterMode: AlbumFilterMode = 'all',
): AlbumCatalogViewModel {
  const sortedAlbums = buildAlbumSummaries(ratings, sortMode, filterMode, { catalogOnly: true });
  const favoriteAlbums = sortedAlbums
    .filter((album) => album.exploreTier === 'favorite')
    .sort((a, b) => compareAlbumSort(a, b, 'favorite'));
  const exploringAlbums = sortedAlbums
    .filter((album) => album.exploreTier === 'exploring')
    .sort((a, b) => compareAlbumSort(a, b, 'needs_ranking'));

  return {
    stats: buildAlbumCollectionStats(sortedAlbums, ratings),
    featuredAlbum: favoriteAlbums[0] ?? sortedAlbums[0] ?? null,
    continueAlbum: pickContinueAlbum(sortedAlbums),
    favoriteAlbums,
    exploringAlbums,
    sortedAlbums,
  };
}

export function buildAlbumDetail(
  album: AlbumSummary,
  allAlbums: AlbumSummary[],
  libraryAverage: number,
): AlbumDetailViewModel {
  const rankAmongAlbums =
    [...allAlbums]
      .sort((a, b) => b.adjustedScore - a.adjustedScore || b.rankedCount - a.rankedCount)
      .findIndex((item) => item.key === album.key) + 1;

  const insights: string[] = [];
  const delta = Number((album.averageScore - libraryAverage).toFixed(1));
  if (libraryAverage > 0 && Math.abs(delta) >= 0.3) {
    insights.push(
      delta > 0
        ? `You rate this ${album.albumTypeBadge.toLowerCase()} ${delta.toFixed(1)} points above your library average.`
        : `You rate this ${album.albumTypeBadge.toLowerCase()} ${Math.abs(delta).toFixed(1)} points below your library average.`,
    );
  }

  insights.push(`${album.bestSong.title} is your highest-rated track from this release.`);

  if (album.rankedSongs.length >= 2 && album.rankedSongs.every((song) => song.score >= 8)) {
    insights.push('You have not rated any song from this release below 8.0.');
  }

  if (rankAmongAlbums > 0) {
    insights.push(`This is your #${rankAmongAlbums} ${album.albumTypeBadge.toLowerCase()} by adjusted score.`);
  }

  return {
    summary: album,
    songsLeftToRank: album.songsLeft,
    isComplete: album.isComplete,
    completionMessage: album.completionStatus || getExploringProgressCopy(album),
    insights: insights.slice(0, 4),
    rankAmongAlbums,
  };
}
