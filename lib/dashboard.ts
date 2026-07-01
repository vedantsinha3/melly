import type { RatingWithTrack } from '@/types';
import {
  buildTasteProfileAnalytics,
  type HistogramBucket,
  type TasteProfileModule,
} from '@/lib/scoreHistogram';

type QueueProgress = {
  isActive: boolean;
  current: number;
  total: number;
};

export type DashboardViewModel = {
  summary: {
    totalRanked: number;
    averageScore: number;
    perfectScores: number;
    favoriteArtist: string | null;
    lastRankedAt: string | null;
  };
  tasteProfile: {
    topArtists: Array<{
      name: string;
      count: number;
      averageScore: number;
      artworkUrl: string | null;
    }>;
    topArtistByScore: { name: string; average: number } | null;
    scoreHistogram: HistogramBucket[];
    profile: TasteProfileModule | null;
  };
  recentActivity: {
    items: Array<{
      ratingId: string;
      trackName: string;
      artists: string;
      artworkUrl: string | null;
      score: number;
      rankedAt: string;
    }>;
  };
  rankingHealth: {
    notesCoverage: { withNotes: number; total: number; pct: number };
    previewCoverage: { withPreview: number; total: number; pct: number };
    queueProgress: QueueProgress;
  };
};


function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildDashboardViewModel(
  ratings: RatingWithTrack[],
  queueProgress: QueueProgress,
): DashboardViewModel {
  const totalRanked = ratings.length;
  const averageScore =
    totalRanked === 0
      ? 0
      : Number((ratings.reduce((sum, item) => sum + Number(item.score), 0) / totalRanked).toFixed(1));

  const recentByDate = [...ratings]
    .sort((a, b) => {
      const aTime = new Date(a.created_at ?? a.listened_at).getTime();
      const bTime = new Date(b.created_at ?? b.listened_at).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  const lastRankedAt = recentByDate[0]?.created_at ?? recentByDate[0]?.listened_at ?? null;

  const artistCount = new Map<string, number>();
  const artistScores = new Map<string, { total: number; count: number }>();
  const artistArtwork = new Map<string, string | null>();
  for (const rating of ratings) {
    for (const artist of rating.track.artist_names) {
      artistCount.set(artist, (artistCount.get(artist) ?? 0) + 1);
      const current = artistScores.get(artist) ?? { total: 0, count: 0 };
      artistScores.set(artist, { total: current.total + Number(rating.score), count: current.count + 1 });
      if (!artistArtwork.has(artist) && rating.track.album_art_url) {
        artistArtwork.set(artist, rating.track.album_art_url);
      }
    }
  }

  const perfectScores = ratings.filter((rating) => Number(rating.score) >= 10).length;

  const topArtists = [...artistCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => {
      const scores = artistScores.get(name);
      return {
        name,
        count,
        averageScore: scores ? Number((scores.total / scores.count).toFixed(1)) : 0,
        artworkUrl: artistArtwork.get(name) ?? null,
      };
    });

  const favoriteArtist = topArtists[0]?.name ?? null;

  const topArtistByScore = [...artistScores.entries()]
    .filter(([, value]) => value.count >= 2)
    .sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)[0];

  const topArtistSongCount = topArtists[0]?.count ?? 0;
  const tasteAnalytics = buildTasteProfileAnalytics(ratings, artistCount.size, topArtistSongCount);

  const withNotes = ratings.filter((rating) => Boolean(rating.notes?.trim())).length;
  const withPreview = ratings.filter((rating) => Boolean(rating.track.preview_url)).length;
  const notesPct = totalRanked === 0 ? 0 : clampPercent((withNotes / totalRanked) * 100);
  const previewPct = totalRanked === 0 ? 0 : clampPercent((withPreview / totalRanked) * 100);

  return {
    summary: {
      totalRanked,
      averageScore,
      perfectScores,
      favoriteArtist,
      lastRankedAt,
    },
    tasteProfile: {
      topArtists,
      topArtistByScore: topArtistByScore
        ? {
            name: topArtistByScore[0],
            average: Number((topArtistByScore[1].total / topArtistByScore[1].count).toFixed(1)),
          }
        : null,
      scoreHistogram: tasteAnalytics.histogram,
      profile: tasteAnalytics.profile,
    },
    recentActivity: {
      items: recentByDate.map((rating) => ({
        ratingId: rating.id,
        trackName: rating.track.name,
        artists: rating.track.artist_names.join(', '),
        artworkUrl: rating.track.album_art_url,
        score: Number(rating.score),
        rankedAt: rating.created_at ?? rating.listened_at,
      })),
    },
    rankingHealth: {
      notesCoverage: { withNotes, total: totalRanked, pct: notesPct },
      previewCoverage: { withPreview, total: totalRanked, pct: previewPct },
      queueProgress,
    },
  };
}
