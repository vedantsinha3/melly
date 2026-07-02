import type { RatingWithTrack } from '@/types';

export type AlbumSortMode =
  | 'highest_rated'
  | 'most_completed'
  | 'most_ranked'
  | 'recently_ranked'
  | 'artist_az';

export type AlbumFilterMode = 'all' | 'album' | 'ep';

export type AlbumTypeValue = 'album' | 'ep';

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
  rankedCount: number;
  totalTrackCount: number | null;
  completionPct: number | null;
  bestSong: AlbumRankedSong;
  lowestSong: AlbumRankedSong;
  perfectScoreCount: number;
  recentRankedAt: string;
  rankedSongs: AlbumRankedSong[];
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
  if (track.album_id?.trim()) return `id:${track.album_id}`;
  return `name:${normalize(track.album_name)}|artist:${normalize(track.artist_names[0] ?? 'unknown')}`;
}

function toAlbumType(value?: string | null): AlbumTypeValue {
  if (!value) return 'album';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'ep') return 'ep';
  return 'album';
}

function isEligibleAlbumTrack(track: RatingWithTrack['track']): boolean {
  const kind = track.album_type?.trim().toLowerCase();
  if (!kind) return true;
  if (kind === 'single') return false;
  if (kind === 'compilation') return false;
  return kind === 'album' || kind === 'ep';
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
      return bPct - aPct || b.averageScore - a.averageScore;
    }
    case 'most_ranked':
      return b.rankedCount - a.rankedCount || b.averageScore - a.averageScore;
    case 'recently_ranked':
      return (
        new Date(b.recentRankedAt).getTime() - new Date(a.recentRankedAt).getTime() ||
        b.averageScore - a.averageScore
      );
    case 'artist_az':
      return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
    case 'highest_rated':
    default:
      return b.averageScore - a.averageScore || b.rankedCount - a.rankedCount;
  }
}

export function buildAlbumSummaries(
  ratings: RatingWithTrack[],
  sortMode: AlbumSortMode,
  filterMode: AlbumFilterMode,
): AlbumSummary[] {
  const grouped = new Map<string, RatingWithTrack[]>();

  for (const rating of ratings) {
    if (!isEligibleAlbumTrack(rating.track)) continue;
    const key = buildAlbumKey(rating.track);
    const list = grouped.get(key) ?? [];
    list.push(rating);
    grouped.set(key, list);
  }

  const albums = [...grouped.entries()].map(([key, albumRatings]) => {
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

    return {
      key,
      albumId: representative.track.album_id ?? null,
      title: representative.track.album_name,
      artist: representative.track.artist_names[0] ?? 'Unknown artist',
      artworkUrl: representative.track.album_art_url,
      albumType,
      albumTypeBadge: albumType === 'ep' ? 'EP' : 'Album',
      releaseYear: representative.track.album_release_date?.slice(0, 4) ?? null,
      averageScore,
      rankedCount,
      totalTrackCount,
      completionPct,
      bestSong,
      lowestSong,
      perfectScoreCount: rankedSongs.filter((song) => song.score >= 9.95).length,
      recentRankedAt: [...rankedSongs]
        .sort((a, b) => new Date(b.rankedAt).getTime() - new Date(a.rankedAt).getTime())[0].rankedAt,
      rankedSongs,
    } satisfies AlbumSummary;
  });

  const filtered = albums.filter((album) =>
    filterMode === 'all' ? true : filterMode === 'album' ? album.albumType === 'album' : album.albumType === 'ep',
  );

  return filtered.sort((a, b) => compareAlbumSort(a, b, sortMode));
}

export function buildAlbumDetail(
  album: AlbumSummary,
  allAlbums: AlbumSummary[],
  libraryAverage: number,
): AlbumDetailViewModel {
  const rankAmongAlbums =
    [...allAlbums]
      .sort((a, b) => b.averageScore - a.averageScore || b.rankedCount - a.rankedCount)
      .findIndex((item) => item.key === album.key) + 1;
  const songsLeftToRank =
    album.totalTrackCount && album.totalTrackCount > album.rankedCount
      ? album.totalTrackCount - album.rankedCount
      : 0;
  const isComplete = songsLeftToRank === 0;

  const completionMessage = isComplete
    ? 'Album complete'
    : songsLeftToRank && songsLeftToRank > 0
      ? `${songsLeftToRank} song${songsLeftToRank === 1 ? '' : 's'} left to complete this album.`
      : `You've ranked ${album.rankedCount} song${album.rankedCount === 1 ? '' : 's'} from this release.`;

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
    insights.push(`This is your #${rankAmongAlbums} ${album.albumTypeBadge.toLowerCase()} by average score.`);
  }

  return {
    summary: album,
    songsLeftToRank,
    isComplete,
    completionMessage,
    insights: insights.slice(0, 4),
    rankAmongAlbums,
  };
}
