import { estimateComparisonCount } from '@/lib/ranking';
import { buildAlbumKey } from '@/lib/albums';
import type { RatingWithTrack } from '@/types';

export type NeighborSong = {
  ratingId: string;
  trackName: string;
  artistNames: string;
  artworkUrl: string | null;
  score: number;
  rankPosition: number;
};

export type SongDetailViewModel = {
  rating: RatingWithTrack;
  heroSummary: string;
  neighbors: {
    above: NeighborSong | null;
    below: NeighborSong | null;
    current: NeighborSong;
  };
  similarSongs: NeighborSong[];
  journey: {
    rankedAt: string;
    comparisonCount: number;
    confidencePct: number;
    artistRankLabel: string | null;
  };
  artistContext: {
    name: string;
    averageScore: number;
    songsRanked: number;
  };
  albumContext: {
    key: string;
    name: string;
    averageScore: number;
    songsRanked: number;
    artworkUrl: string | null;
  };
};

function matchesArtist(artistNames: string[], target: string): boolean {
  const normalized = target.trim().toLowerCase();
  return artistNames.some((name) => name.trim().toLowerCase() === normalized);
}

function toNeighbor(rating: RatingWithTrack): NeighborSong {
  return {
    ratingId: rating.id,
    trackName: rating.track.name,
    artistNames: rating.track.artist_names.join(', '),
    artworkUrl: rating.track.album_art_url,
    score: Number(rating.score),
    rankPosition: rating.rank_position,
  };
}

function deriveConfidence(comparisonCount: number, totalRanked: number): number {
  if (totalRanked <= 1) return 95;
  if (comparisonCount === 0) return 78;
  const expected = estimateComparisonCount(totalRanked);
  const ratio = comparisonCount / Math.max(expected, 1);
  return Math.round(Math.min(94, Math.max(52, 48 + ratio * 38 + comparisonCount * 6)));
}

function buildHeroSummary(rating: RatingWithTrack, totalRanked: number): string {
  if (totalRanked <= 1) {
    return 'The first song in your ranked library — the benchmark everything else is measured against.';
  }

  const tierPct = (rating.rank_position / totalRanked) * 100;
  const score = Number(rating.score);

  if (tierPct <= 12 || score >= 9.2) {
    return 'Sits in the top tier of your library — one of the songs you rate highest.';
  }
  if (tierPct <= 35) {
    return 'Earned a strong spot in the upper half of your ranked collection.';
  }
  if (tierPct >= 80) {
    return 'Toward the lower end of your list, but still part of your personal canon.';
  }
  return 'Holds a steady place in the middle of your rankings — neither a deep cut nor a top pick.';
}

function buildArtistRankLabel(
  rating: RatingWithTrack,
  allRatings: RatingWithTrack[],
  primaryArtist: string,
): string | null {
  const artistSongs = allRatings
    .filter((r) => matchesArtist(r.track.artist_names, primaryArtist))
    .sort((a, b) => Number(b.score) - Number(a.score) || a.rank_position - b.rank_position);

  const index = artistSongs.findIndex((r) => r.id === rating.id);
  if (index < 0 || artistSongs.length < 2) return null;

  const rank = index + 1;
  const ordinal =
    rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;

  return `${ordinal} ${primaryArtist} song in your library`;
}

export function buildSongDetail(
  rating: RatingWithTrack,
  allRatings: RatingWithTrack[],
  comparisonCount: number,
): SongDetailViewModel {
  const sorted = [...allRatings].sort((a, b) => a.rank_position - b.rank_position);
  const index = sorted.findIndex((r) => r.id === rating.id);
  const above = index > 0 ? toNeighbor(sorted[index - 1]) : null;
  const below = index >= 0 && index < sorted.length - 1 ? toNeighbor(sorted[index + 1]) : null;
  const current = toNeighbor(rating);

  const similarSongs = sorted
    .slice(Math.max(0, index - 2), index)
    .concat(sorted.slice(index + 1, index + 3))
    .map(toNeighbor);

  const primaryArtist = rating.track.artist_names[0] ?? 'Unknown artist';
  const artistRatings = allRatings.filter((r) =>
    matchesArtist(r.track.artist_names, primaryArtist),
  );
  const artistScores = artistRatings.map((r) => Number(r.score));
  const artistAverage =
    artistScores.length === 0
      ? 0
      : Number((artistScores.reduce((a, b) => a + b, 0) / artistScores.length).toFixed(1));

  const albumName = rating.track.album_name?.trim() || 'Unknown album';
  const albumRatings = allRatings.filter(
    (r) => r.track.album_name?.trim().toLowerCase() === albumName.toLowerCase(),
  );
  const albumScores = albumRatings.map((r) => Number(r.score));
  const albumAverage =
    albumScores.length === 0
      ? 0
      : Number((albumScores.reduce((a, b) => a + b, 0) / albumScores.length).toFixed(1));

  return {
    rating,
    heroSummary: buildHeroSummary(rating, allRatings.length),
    neighbors: { above, below, current },
    similarSongs,
    journey: {
      rankedAt: rating.created_at ?? rating.listened_at,
      comparisonCount,
      confidencePct: deriveConfidence(comparisonCount, allRatings.length),
      artistRankLabel: buildArtistRankLabel(rating, allRatings, primaryArtist),
    },
    artistContext: {
      name: primaryArtist,
      averageScore: artistAverage,
      songsRanked: artistRatings.length,
    },
    albumContext: {
      key: buildAlbumKey(rating.track),
      name: albumName,
      averageScore: albumAverage,
      songsRanked: albumRatings.length,
      artworkUrl: rating.track.album_art_url,
    },
  };
}
