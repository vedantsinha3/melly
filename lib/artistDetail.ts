import { buildAlbumKey } from '@/lib/albums';
import {
  buildScoreHistogram,
  getHistogramChartMaxPct,
  type HistogramBucket,
} from '@/lib/scoreHistogram';
import type { RatingWithTrack } from '@/types';

export type ArtistSongRow = {
  ratingId: string;
  albumKey: string;
  albumType: 'Album' | 'EP';
  trackName: string;
  artistName: string;
  albumName: string;
  artworkUrl: string | null;
  score: number;
  rankPosition: number;
  rankedAt: string;
  hasNotes: boolean;
  notesPreview: string | null;
};

export type ArtistHighlight = {
  name: string;
  score: number;
  ratingId: string;
  artworkUrl?: string | null;
};

export type ArtistHeroViewModel = {
  artworkUrl: string | null;
  supportingArtworkUrls: string[];
  insight: string;
  achievementTitle: string | null;
  achievementRankLabel: string | null;
  metricLine: string;
};

export type ArtistAlbum = {
  key: string;
  name: string;
  artistName: string;
  albumType: 'Album' | 'EP';
  artworkUrl: string | null;
  songCount: number;
  averageScore: number;
  bestSong: ArtistHighlight;
};

export type SimilarArtist = {
  name: string;
  averageScore: number;
  songCount: number;
  artworkUrl: string | null;
};

export type NoteHighlight = {
  trackName: string;
  note: string;
  ratingId: string;
};

export type ArtistSortMode = 'highest' | 'lowest' | 'recent' | 'rank';

export type ArtistDetailViewModel = {
  artistName: string;
  collageUrls: string[];
  hero: ArtistHeroViewModel;
  songsRanked: number;
  averageScore: number;
  overallAverage: number;
  scoreDelta: number;
  lowestScore: number;
  highestSong: ArtistHighlight | null;
  lowestSong: ArtistHighlight | null;
  favoriteSong: ArtistHighlight | null;
  perfectScores: number;
  recentRank: { name: string; rankedAt: string; ratingId: string } | null;
  artistRankAmong: number | null;
  totalArtists: number;
  libraryPercentile: number;
  librarySharePct: number;
  consistencyScore: number;
  rankBadge: string | null;
  isHighestRatedArtist: boolean;
  histogram: HistogramBucket[];
  chartMaxPct: number;
  insights: string[];
  songs: ArtistSongRow[];
  albums: ArtistAlbum[];
  similarArtists: SimilarArtist[];
  noteHighlights: NoteHighlight[];
};

type ArtistAggregate = {
  name: string;
  count: number;
  totalScore: number;
  averageScore: number;
  artworkUrl: string | null;
};

function matchesArtist(artistNames: string[], target: string): boolean {
  const normalized = target.trim().toLowerCase();
  return artistNames.some((name) => name.trim().toLowerCase() === normalized);
}

function stdDev(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  return Math.sqrt(variance);
}

function buildArtistAggregates(ratings: RatingWithTrack[]): ArtistAggregate[] {
  const map = new Map<string, { count: number; total: number; artworkUrl: string | null }>();

  for (const rating of ratings) {
    for (const artist of rating.track.artist_names) {
      const current = map.get(artist) ?? { count: 0, total: 0, artworkUrl: null };
      current.count += 1;
      current.total += Number(rating.score);
      if (!current.artworkUrl && rating.track.album_art_url) {
        current.artworkUrl = rating.track.album_art_url;
      }
      map.set(artist, current);
    }
  }

  return [...map.entries()]
    .map(([name, value]) => ({
      name,
      count: value.count,
      totalScore: value.total,
      averageScore: Number((value.total / value.count).toFixed(1)),
      artworkUrl: value.artworkUrl,
    }))
    .sort((a, b) => b.count - a.count);
}

function computeConsistencyScore(artistStdDev: number): number {
  return Math.round(Math.max(18, Math.min(99, 100 - artistStdDev * 28)));
}

function computeLibraryPercentile(artistAverage: number, allAverages: number[]): number {
  if (allAverages.length <= 1) return 100;
  const lower = allAverages.filter((avg) => avg < artistAverage).length;
  return Math.round((lower / (allAverages.length - 1)) * 100);
}

function buildRankBadge(
  artistName: string,
  rankByCount: number,
  rankByScore: number,
  aggregates: ArtistAggregate[],
): { badge: string | null; isHighestRated: boolean } {
  const qualifiesForScore = (aggregates.find((a) => a.name === artistName)?.count ?? 0) >= 2;
  const isTopByCount = rankByCount === 1 && aggregates.length > 1;
  const isTopByScore = qualifiesForScore && rankByScore === 1 && aggregates.filter((a) => a.count >= 2).length > 1;

  if (isTopByScore) {
    return { badge: 'Highest-rated artist', isHighestRated: true };
  }
  if (isTopByCount) {
    return { badge: `#${rankByCount} Artist`, isHighestRated: false };
  }
  if (rankByCount <= 3) {
    return { badge: `#${rankByCount} Artist`, isHighestRated: false };
  }
  return { badge: null, isHighestRated: false };
}

function toSongRow(rating: RatingWithTrack, pageArtist: string): ArtistSongRow {
  const notes = rating.notes?.trim() ?? '';
  return {
    ratingId: rating.id,
    albumKey: buildAlbumKey(rating.track),
    albumType: rating.track.album_type?.toLowerCase() === 'ep' ? 'EP' : 'Album',
    trackName: rating.track.name,
    artistName: pageArtist,
    albumName: rating.track.album_name,
    artworkUrl: rating.track.album_art_url,
    score: Number(rating.score),
    rankPosition: rating.rank_position,
    rankedAt: rating.created_at ?? rating.listened_at,
    hasNotes: notes.length > 0,
    notesPreview: notes.length > 0 ? notes : null,
  };
}

function buildAlbums(songs: ArtistSongRow[]): ArtistAlbum[] {
  const map = new Map<string, ArtistSongRow[]>();
  for (const song of songs) {
    const key = song.albumKey;
    const list = map.get(key) ?? [];
    list.push(song);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, albumSongs]) => {
      const scores = albumSongs.map((s) => s.score);
      const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
      const best = [...albumSongs].sort((a, b) => b.score - a.score)[0];
      return {
        key,
        name: albumSongs[0].albumName,
        artistName: albumSongs[0].artistName,
        albumType: albumSongs[0].albumType,
        artworkUrl: albumSongs.find((s) => s.artworkUrl)?.artworkUrl ?? null,
        songCount: albumSongs.length,
        averageScore: avg,
        bestSong: {
          name: best.trackName,
          score: best.score,
          ratingId: best.ratingId,
        },
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || b.songCount - a.songCount);
}

function buildSimilarArtists(
  artistName: string,
  artistAverage: number,
  aggregates: ArtistAggregate[],
): SimilarArtist[] {
  return aggregates
    .filter((a) => a.name !== artistName && a.count >= 2)
    .map((a) => ({ ...a, scoreGap: Math.abs(a.averageScore - artistAverage) }))
    .sort((a, b) => a.scoreGap - b.scoreGap || b.count - a.count)
    .slice(0, 4)
    .map((a) => ({
      name: a.name,
      averageScore: a.averageScore,
      songCount: a.count,
      artworkUrl: a.artworkUrl,
    }));
}

function buildNoteHighlights(songs: ArtistSongRow[]): NoteHighlight[] {
  return songs
    .filter((song) => song.notesPreview)
    .sort((a, b) => new Date(b.rankedAt).getTime() - new Date(a.rankedAt).getTime())
    .slice(0, 3)
    .map((song) => ({
      trackName: song.trackName,
      note: song.notesPreview!,
      ratingId: song.ratingId,
    }));
}

function buildHeroInsight(
  artistName: string,
  songs: ArtistSongRow[],
  scoreDelta: number,
  overallAverage: number,
  rankByCount: number,
  libraryPercentile: number,
): string {
  const allAbove =
    songs.length >= 2 && songs.every((song) => song.score > overallAverage);

  if (allAbove) {
    return `Every ranked ${artistName} song scores above your library average.`;
  }
  if (scoreDelta >= 2.5) {
    return `You consistently rate ${artistName} far above the rest of your library.`;
  }
  if (rankByCount === 1) {
    return `This artist consistently lands near the top of your rankings.`;
  }
  if (libraryPercentile >= 88) {
    return `You almost never miss with ${artistName}.`;
  }
  if (scoreDelta >= 0.8) {
    return `You score ${artistName} ${scoreDelta.toFixed(1)} points above your library average.`;
  }
  if (scoreDelta <= -0.8) {
    return `${artistName} sits below your usual standards — a tougher sell in your library.`;
  }
  return `${artistName} has a clear place in your ranked collection.`;
}

function buildHeroAchievement(
  rankByCount: number,
  totalArtists: number,
  isHighestRated: boolean,
): { title: string | null; rankLabel: string | null } {
  if (rankByCount <= 0 || totalArtists <= 1) {
    return { title: null, rankLabel: null };
  }

  if (rankByCount === 1) {
    return {
      title: isHighestRated ? '🏆 Your #1 Artist' : '🏆 #1 Artist',
      rankLabel: `#1 of ${totalArtists} artists`,
    };
  }

  if (rankByCount <= 3) {
    return {
      title: `Your #${rankByCount} Artist`,
      rankLabel: `#${rankByCount} of ${totalArtists} artists`,
    };
  }

  return { title: null, rankLabel: `#${rankByCount} of ${totalArtists} artists` };
}

function buildHeroArtwork(songs: ArtistSongRow[]): {
  artworkUrl: string | null;
  supportingArtworkUrls: string[];
} {
  const urls = [
    ...new Set(songs.map((song) => song.artworkUrl).filter((url): url is string => Boolean(url))),
  ];

  if (urls.length === 0) {
    return { artworkUrl: null, supportingArtworkUrls: [] };
  }

  return {
    artworkUrl: urls[0],
    supportingArtworkUrls: urls.slice(1, 3),
  };
}

function buildHeroMetricLine(
  averageScore: number,
  songsRanked: number,
  scoreDelta: number,
): string {
  const songsLabel = `${songsRanked} ${songsRanked === 1 ? 'song' : 'songs'} ranked`;
  const base = `${averageScore.toFixed(1)} average · ${songsLabel}`;

  if (Math.abs(scoreDelta) < 0.1) {
    return base;
  }

  const delta =
    scoreDelta > 0
      ? `${scoreDelta.toFixed(1)} points above your library average`
      : `${Math.abs(scoreDelta).toFixed(1)} points below your library average`;

  return `${base} · ${delta}`;
}

function buildInsights(
  artistName: string,
  songs: ArtistSongRow[],
  averageScore: number,
  overallAverage: number,
  favoriteSong: ArtistHighlight | null,
  lowestScore: number,
  artistStdDev: number,
  overallStdDev: number,
  artistRankAmong: number | null,
  libraryPercentile: number,
): string[] {
  const insights: string[] = [];
  const delta = averageScore - overallAverage;

  if (songs.length >= 4 && artistRankAmong != null && artistRankAmong <= 3) {
    insights.push(
      `${artistName} is one of your most represented artists with ${songs.length} ranked songs.`,
    );
  } else if (songs.length >= 2) {
    insights.push(`${songs.length} ranked songs — ${artistName} is a regular part of your library.`);
  } else if (songs.length === 1) {
    insights.push(`One ${artistName} track ranked so far. Rank more to sharpen this profile.`);
  }

  if (Math.abs(delta) >= 0.3) {
    insights.push(
      delta > 0
        ? `${artistName} scores ${delta.toFixed(1)} points above your library average.`
        : `${artistName} runs ${Math.abs(delta).toFixed(1)} points below your library average.`,
    );
  } else if (overallAverage > 0) {
    insights.push(`${artistName} lands close to your overall taste — right near the middle.`);
  }

  if (favoriteSong) {
    if (favoriteSong.score >= 10) {
      insights.push(
        `"${favoriteSong.name}" is the standout so far, sitting at a perfect ${favoriteSong.score.toFixed(1)}.`,
      );
    } else {
      insights.push(`"${favoriteSong.name}" leads the catalog at ${favoriteSong.score.toFixed(1)}.`);
    }
  }

  if (songs.length >= 2) {
    if (lowestScore >= 6.5 && songs.length >= 2) {
      insights.push(`You haven't rated a ${artistName} song below ${lowestScore.toFixed(1)} yet.`);
    } else if (artistStdDev > overallStdDev * 1.15 && songs.length >= 3) {
      insights.push(`Scores span a wide range — you're selective about which ${artistName} tracks earn top marks.`);
    }
  }

  if (libraryPercentile >= 85 && insights.length < 4) {
    insights.push(`Higher than ${libraryPercentile}% of artists in your library by average score.`);
  }

  return insights.slice(0, 4);
}

export function sortArtistSongs(songs: ArtistSongRow[], mode: ArtistSortMode): ArtistSongRow[] {
  const sorted = [...songs];
  switch (mode) {
    case 'lowest':
      return sorted.sort((a, b) => a.score - b.score || a.rankPosition - b.rankPosition);
    case 'recent':
      return sorted.sort(
        (a, b) => new Date(b.rankedAt).getTime() - new Date(a.rankedAt).getTime(),
      );
    case 'rank':
      return sorted.sort((a, b) => a.rankPosition - b.rankPosition);
    case 'highest':
    default:
      return sorted.sort((a, b) => b.score - a.score || a.rankPosition - b.rankPosition);
  }
}

export function buildArtistDetail(
  ratings: RatingWithTrack[],
  artistName: string,
): ArtistDetailViewModel | null {
  const decodedName = decodeURIComponent(artistName);
  const artistRatings = ratings.filter((rating) =>
    matchesArtist(rating.track.artist_names, decodedName),
  );

  if (artistRatings.length === 0) {
    return null;
  }

  const aggregates = buildArtistAggregates(ratings);
  const songs = artistRatings.map((r) => toSongRow(r, decodedName));
  const scores = songs.map((song) => song.score);
  const averageScore = Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1));
  const overallAverage =
    ratings.length === 0
      ? 0
      : Number(
          (ratings.reduce((sum, r) => sum + Number(r.score), 0) / ratings.length).toFixed(1),
        );

  const byScoreDesc = sortArtistSongs(songs, 'highest');
  const byScoreAsc = sortArtistSongs(songs, 'lowest');
  const byRecent = sortArtistSongs(songs, 'recent');

  const highestSong = byScoreDesc[0]
    ? {
        name: byScoreDesc[0].trackName,
        score: byScoreDesc[0].score,
        ratingId: byScoreDesc[0].ratingId,
        artworkUrl: byScoreDesc[0].artworkUrl,
      }
    : null;

  const lowestSong = byScoreAsc[0]
    ? {
        name: byScoreAsc[0].trackName,
        score: byScoreAsc[0].score,
        ratingId: byScoreAsc[0].ratingId,
        artworkUrl: byScoreAsc[0].artworkUrl,
      }
    : null;

  const favoriteSong = highestSong;
  const perfectScores = songs.filter((song) => song.score >= 10).length;
  const recent = byRecent[0];
  const lowestScore = lowestSong?.score ?? 0;

  const collageUrls = [
    ...new Set(
      songs.map((song) => song.artworkUrl).filter((url): url is string => Boolean(url)),
    ),
  ].slice(0, 4);

  const sortedByCount = [...aggregates].sort((a, b) => b.count - a.count);
  const sortedByScore = [...aggregates]
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.averageScore - a.averageScore);

  const rankByCount = sortedByCount.findIndex((a) => a.name === decodedName) + 1;
  const rankByScore = sortedByScore.findIndex((a) => a.name === decodedName) + 1;
  const scoreDelta = Number((averageScore - overallAverage).toFixed(1));
  const { badge, isHighestRated } = buildRankBadge(decodedName, rankByCount, rankByScore, aggregates);
  const achievement = buildHeroAchievement(rankByCount, aggregates.length, isHighestRated);
  const heroArtwork = buildHeroArtwork(songs);

  const allAverages = aggregates.map((a) => a.averageScore);
  const libraryPercentile = computeLibraryPercentile(averageScore, allAverages);
  const librarySharePct =
    ratings.length === 0 ? 0 : Math.round((songs.length / ratings.length) * 100);

  const histogram = buildScoreHistogram(artistRatings);
  const artistStdDev = stdDev(scores);
  const overallStdDev = stdDev(ratings.map((r) => Number(r.score)));
  const consistencyScore = computeConsistencyScore(artistStdDev);

  const albums = buildAlbums(songs);
  const similarArtists = buildSimilarArtists(decodedName, averageScore, aggregates);
  const noteHighlights = buildNoteHighlights(songs);

  return {
    artistName: decodedName,
    collageUrls,
    hero: {
      artworkUrl: heroArtwork.artworkUrl,
      supportingArtworkUrls: heroArtwork.supportingArtworkUrls,
      insight: buildHeroInsight(
        decodedName,
        songs,
        scoreDelta,
        overallAverage,
        rankByCount,
        libraryPercentile,
      ),
      achievementTitle: achievement.title,
      achievementRankLabel: achievement.rankLabel,
      metricLine: buildHeroMetricLine(averageScore, songs.length, scoreDelta),
    },
    songsRanked: songs.length,
    averageScore,
    overallAverage,
    scoreDelta,
    lowestScore,
    highestSong,
    lowestSong,
    favoriteSong,
    perfectScores,
    recentRank: recent
      ? { name: recent.trackName, rankedAt: recent.rankedAt, ratingId: recent.ratingId }
      : null,
    artistRankAmong: rankByCount > 0 ? rankByCount : null,
    totalArtists: aggregates.length,
    libraryPercentile,
    librarySharePct,
    consistencyScore,
    rankBadge: badge,
    isHighestRatedArtist: isHighestRated,
    histogram,
    chartMaxPct: getHistogramChartMaxPct(histogram),
    insights: buildInsights(
      decodedName,
      songs,
      averageScore,
      overallAverage,
      favoriteSong,
      lowestScore,
      artistStdDev,
      overallStdDev,
      rankByCount > 0 ? rankByCount : null,
      libraryPercentile,
    ),
    songs: sortArtistSongs(songs, 'highest'),
    albums,
    similarArtists,
    noteHighlights,
  };
}
