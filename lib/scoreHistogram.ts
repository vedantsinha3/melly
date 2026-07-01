export type HistogramBucket = {
  rating: number;
  count: number;
  pct: number;
};

export type RatingStats = {
  average: number;
  median: number;
  variance: number;
  stdDev: number;
  perfectScores: number;
  perfectPct: number;
  artistCount: number;
  artistDiversity: number;
  topArtistDominance: number;
  lowBucketPct: number;
  midBucketPct: number;
  highBucketPct: number;
  eliteBucketPct: number;
  belowFivePct: number;
  aboveEightPct: number;
  midClusterPct: number;
  spread: number;
};

export type TasteConfidence = 'low' | 'medium' | 'high';

export type TasteProfileModule = {
  personaTitle: string;
  confidence: TasteConfidence;
  confidenceLabel: string;
  insight: string;
  statsLine: string;
};

export type TasteProfileAnalytics = {
  histogram: HistogramBucket[];
  stats: RatingStats;
  profile: TasteProfileModule | null;
};

/** @deprecated Use TasteProfileModule */
export type ListenerPersona = {
  title: string;
};

/** Smooth red → amber → green scale across the 1–10 rating range. */
const LIGHT_BAR_COLORS = [
  '#C85A5A',
  '#C96658',
  '#CF7A5A',
  '#C4925A',
  '#B89A58',
  '#A89E58',
  '#7BA868',
  '#52A664',
  '#2E9E58',
  '#169C46',
] as const;

const DARK_BAR_COLORS = [
  '#D46A6A',
  '#D47666',
  '#D88668',
  '#D49A68',
  '#C8A266',
  '#B8A666',
  '#8FBA78',
  '#66BA7A',
  '#42B06A',
  '#28B058',
] as const;

type PersonaId =
  | 'selective_curator'
  | 'taste_explorer'
  | 'balanced_rater'
  | 'generous_listener'
  | 'tough_critic'
  | 'deep_cut_hunter'
  | 'loyal_fan'
  | 'mood_chaser';

type PersonaDef = {
  id: PersonaId;
  title: string;
  score: (stats: RatingStats, totalRanked: number) => number;
  minScore: number;
};

const PERSONAS: PersonaDef[] = [
  {
    id: 'tough_critic',
    title: 'Tough Critic',
    minScore: 5,
    score: (s, t) => {
      let pts = 0;
      if (s.average <= 5.4) pts += 4;
      else if (s.average <= 6) pts += 2;
      if (s.belowFivePct >= 0.22) pts += 3;
      if (s.aboveEightPct < 0.18) pts += 2;
      if (s.eliteBucketPct < 0.06 && t >= 8) pts += 1;
      return pts;
    },
  },
  {
    id: 'generous_listener',
    title: 'Generous Listener',
    minScore: 5,
    score: (s) => {
      let pts = 0;
      if (s.average >= 7.6) pts += 4;
      else if (s.average >= 7) pts += 2;
      if (s.aboveEightPct >= 0.48) pts += 3;
      if (s.highBucketPct + s.eliteBucketPct >= 0.55) pts += 2;
      return pts;
    },
  },
  {
    id: 'selective_curator',
    title: 'Selective Curator',
    minScore: 4,
    score: (s) => {
      let pts = 0;
      if (s.average >= 5.5 && s.average <= 7.4) pts += 2;
      if (s.eliteBucketPct < 0.1) pts += 3;
      if (s.perfectPct < 0.07) pts += 2;
      if (s.aboveEightPct < 0.28) pts += 1;
      return pts;
    },
  },
  {
    id: 'mood_chaser',
    title: 'Mood Chaser',
    minScore: 5,
    score: (s) => {
      let pts = 0;
      if (s.stdDev >= 2.2) pts += 4;
      else if (s.stdDev >= 1.9) pts += 2;
      if (s.lowBucketPct > 0.08 && s.eliteBucketPct > 0.06) pts += 3;
      if (s.spread >= 7) pts += 1;
      return pts;
    },
  },
  {
    id: 'taste_explorer',
    title: 'Taste Explorer',
    minScore: 5,
    score: (s) => {
      let pts = 0;
      if (s.spread >= 8) pts += 3;
      else if (s.spread >= 6) pts += 2;
      if (s.stdDev >= 1.7) pts += 2;
      if (s.lowBucketPct > 0.05 && s.eliteBucketPct > 0.04) pts += 2;
      if (s.artistDiversity >= 0.55) pts += 1;
      return pts;
    },
  },
  {
    id: 'deep_cut_hunter',
    title: 'Deep Cut Hunter',
    minScore: 4,
    score: (s) => {
      let pts = 0;
      if (s.artistDiversity >= 0.72) pts += 4;
      else if (s.artistDiversity >= 0.6) pts += 2;
      if (s.artistCount >= 10) pts += 2;
      if (s.topArtistDominance < 0.18) pts += 1;
      return pts;
    },
  },
  {
    id: 'loyal_fan',
    title: 'Loyal Fan',
    minScore: 4,
    score: (s) => {
      let pts = 0;
      if (s.topArtistDominance >= 0.28) pts += 4;
      else if (s.topArtistDominance >= 0.2) pts += 2;
      if (s.artistDiversity <= 0.45) pts += 2;
      if (s.artistCount <= 8 && s.topArtistDominance >= 0.18) pts += 1;
      return pts;
    },
  },
  {
    id: 'balanced_rater',
    title: 'Balanced Rater',
    minScore: 3,
    score: (s) => {
      let pts = 0;
      if (s.midClusterPct >= 0.45) pts += 3;
      if (s.stdDev >= 1.2 && s.stdDev <= 2) pts += 2;
      if (s.lowBucketPct < 0.15 && s.eliteBucketPct < 0.15) pts += 2;
      if (s.average >= 5.2 && s.average <= 7.5) pts += 1;
      return pts;
    },
  },
];

/** Map a decimal rating to a whole-number bucket on the 1–10 scale. */
export function bucketScore(score: number | string): number {
  return Math.max(1, Math.min(10, Math.round(Number(score))));
}

export function buildScoreHistogram(ratings: Array<{ score: number | string }>): HistogramBucket[] {
  const counts = Array.from({ length: 10 }, () => 0);

  for (const rating of ratings) {
    counts[bucketScore(rating.score) - 1] += 1;
  }

  const total = ratings.length;
  return counts.map((count, index) => ({
    rating: index + 1,
    count,
    pct: total === 0 ? 0 : (count / total) * 100,
  }));
}

/** Y-axis ceiling for the distribution chart — scales bars to the data peak. */
export function getHistogramChartMaxPct(histogram: HistogramBucket[]): number {
  const peak = histogram.reduce((max, bucket) => Math.max(max, bucket.pct), 0);
  return Math.max(peak * 1.1, 8);
}

function computeMedian(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1))
    : sorted[mid];
}

function bucketPct(histogram: HistogramBucket[], from: number, to: number, total: number): number {
  if (total === 0) return 0;
  const count = histogram.slice(from - 1, to).reduce((sum, bucket) => sum + bucket.count, 0);
  return count / total;
}

export function computeRatingStats(
  ratings: Array<{ score: number | string }>,
  histogram: HistogramBucket[],
  artistCount: number,
  topArtistSongCount: number,
): RatingStats {
  const total = ratings.length;
  const scores = ratings.map((rating) => Number(rating.score));
  const average =
    total === 0 ? 0 : Number((scores.reduce((sum, score) => sum + score, 0) / total).toFixed(1));
  const median = computeMedian(scores);
  const variance =
    total === 0
      ? 0
      : scores.reduce((sum, score) => sum + (score - average) ** 2, 0) / total;
  const stdDev = Number(Math.sqrt(variance).toFixed(2));
  const perfectScores = scores.filter((score) => score >= 9.95).length;
  const spread = histogram.filter((bucket) => bucket.count > 0).length;

  return {
    average,
    median,
    variance: Number(variance.toFixed(2)),
    stdDev,
    perfectScores,
    perfectPct: total === 0 ? 0 : perfectScores / total,
    artistCount,
    artistDiversity: total === 0 ? 0 : artistCount / total,
    topArtistDominance: total === 0 ? 0 : topArtistSongCount / total,
    lowBucketPct: bucketPct(histogram, 1, 3, total),
    midBucketPct: bucketPct(histogram, 4, 6, total),
    highBucketPct: bucketPct(histogram, 7, 8, total),
    eliteBucketPct: bucketPct(histogram, 9, 10, total),
    belowFivePct: bucketPct(histogram, 1, 4, total),
    aboveEightPct: bucketPct(histogram, 8, 10, total),
    midClusterPct: bucketPct(histogram, 5, 8, total),
    spread,
  };
}

export function getScoreBarColor(rating: number, scheme: 'light' | 'dark' = 'light'): string {
  const palette = scheme === 'dark' ? DARK_BAR_COLORS : LIGHT_BAR_COLORS;
  return palette[Math.max(0, Math.min(9, rating - 1))];
}

export function brightenHexColor(hex: string, amount = 0.14): string {
  const normalized = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  const brightened = channels.map((channel) => Math.min(255, Math.round(channel + (255 - channel) * amount)));
  return `#${brightened.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function resolveConfidence(totalRanked: number): {
  confidence: TasteConfidence;
  confidenceLabel: string;
} {
  if (totalRanked < 25) {
    return { confidence: 'low', confidenceLabel: 'Early read' };
  }
  if (totalRanked < 100) {
    return { confidence: 'medium', confidenceLabel: 'Medium confidence' };
  }
  return { confidence: 'high', confidenceLabel: 'High confidence' };
}

function pickPersona(stats: RatingStats, totalRanked: number): PersonaDef {
  let best = PERSONAS.find((p) => p.id === 'balanced_rater')!;
  let bestScore = -1;

  for (const persona of PERSONAS) {
    const pts = persona.score(stats, totalRanked);
    if (pts >= persona.minScore && pts > bestScore) {
      bestScore = pts;
      best = persona;
    }
  }

  return best;
}

function pctLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function generatePersonaInsight(
  personaId: PersonaId,
  stats: RatingStats,
  confidence: TasteConfidence,
): string {
  const elitePct = pctLabel(stats.eliteBucketPct);
  const aboveEight = pctLabel(stats.aboveEightPct);
  const belowFive = pctLabel(stats.belowFivePct);
  const spread = stats.spread;

  let insight: string;

  switch (personaId) {
    case 'taste_explorer':
      insight =
        stats.eliteBucketPct < 0.12
          ? `You use the full scale freely, but only ${elitePct} of songs earn a 9 or 10.`
          : `Your ratings stretch across ${spread} score buckets, with room on both ends of the scale.`;
      break;
    case 'selective_curator':
      insight = `You keep most scores measured, reserving top ratings for the ${elitePct} of songs that truly stand out.`;
      break;
    case 'balanced_rater':
      insight =
        stats.eliteBucketPct >= 0.1
          ? 'Most of your ratings sit near the middle, but a few clear favorites break through.'
          : 'Your ratings cluster around the midpoint, with few swings to either extreme.';
      break;
    case 'generous_listener':
      insight = `${aboveEight} of your library scores 8 or higher — you tend to find a lot to like.`;
      break;
    case 'tough_critic':
      insight = `With ${belowFive} of ratings below 5 and a ${stats.average.toFixed(1)} average, you rarely hand out easy praise.`;
      break;
    case 'deep_cut_hunter':
      insight = `You've ranked songs from ${stats.artistCount} artists — your taste roams wide rather than staying with a few favorites.`;
      break;
    case 'loyal_fan':
      insight = 'A meaningful share of your rankings come from a tight circle of artists you keep returning to.';
      break;
    case 'mood_chaser':
      insight =
        'Your ratings jump between low and high scores, suggesting you are comfortable calling out both misses and standouts.';
      break;
    default:
      insight = 'Your rating pattern is starting to take shape.';
  }

  if (confidence === 'low') {
    insight = `${insight.replace(/\.$/, '')}, but Melly will get sharper as you rank more songs.`;
    if (!insight.endsWith('.')) insight += '.';
  }

  return insight;
}

function buildStatsLine(stats: RatingStats, totalRanked: number): string {
  const perfectLabel =
    stats.perfectScores === 1 ? '1 perfect score' : `${stats.perfectScores} perfect scores`;
  return `Average ${stats.average.toFixed(1)} · ${perfectLabel} · ${totalRanked} songs ranked`;
}

export function buildTasteProfileModule(
  stats: RatingStats,
  totalRanked: number,
): TasteProfileModule | null {
  if (totalRanked < 3) return null;

  const persona = pickPersona(stats, totalRanked);
  const { confidence, confidenceLabel } = resolveConfidence(totalRanked);
  const insight = generatePersonaInsight(persona.id, stats, confidence);

  return {
    personaTitle: persona.title,
    confidence,
    confidenceLabel,
    insight,
    statsLine: buildStatsLine(stats, totalRanked),
  };
}

export function buildTasteProfileAnalytics(
  ratings: Array<{ score: number | string }>,
  artistCount: number,
  topArtistSongCount: number,
): TasteProfileAnalytics {
  const histogram = buildScoreHistogram(ratings);
  const totalRanked = ratings.length;
  const stats = computeRatingStats(ratings, histogram, artistCount, topArtistSongCount);
  const profile = buildTasteProfileModule(stats, totalRanked);

  return { histogram, stats, profile };
}
