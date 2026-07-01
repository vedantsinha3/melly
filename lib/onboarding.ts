import type { TopTracksTimeRange } from '@/types';

export type ImportPathConfig = {
  value: TopTracksTimeRange;
  title: string;
  period: string;
  description: string;
  estimatedSongsLabel: string;
  estimatedMinutesLabel: string;
  recommended?: boolean;
};

export const IMPORT_PATHS: ImportPathConfig[] = [
  {
    value: 'short_term',
    title: 'Recent rotation',
    period: 'Past 4 weeks',
    description: 'Start with what you have on repeat right now — quick wins that reflect your current vibe.',
    estimatedSongsLabel: '~20–40 songs',
    estimatedMinutesLabel: '~15 min',
  },
  {
    value: 'medium_term',
    title: 'Season favorites',
    period: 'Past 6 months',
    description: 'Rank the songs that shaped your listening lately and build a richer taste profile from day one.',
    estimatedSongsLabel: '~25–50 songs',
    estimatedMinutesLabel: '~25 min',
    recommended: true,
  },
];

export const ONBOARDING_BENEFITS = [
  'Better recommendations',
  'Artist rankings',
  'Taste profile',
  'Rating analytics',
  'Listening insights',
] as const;

export const UNLOCK_FEATURES = [
  {
    id: 'taste',
    title: 'Taste profile',
    description: 'See your persona and how your scores cluster',
    icon: { ios: 'waveform.path', android: 'graphic_eq', web: 'graphic_eq' },
  },
  {
    id: 'artists',
    title: 'Artist rankings',
    description: 'Discover who dominates your ranked list',
    icon: { ios: 'music.mic', android: 'mic', web: 'mic' },
  },
  {
    id: 'analytics',
    title: 'Rating analytics',
    description: 'Track your average score and distribution',
    icon: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  },
  {
    id: 'recommendations',
    title: 'Smarter picks',
    description: 'Get better song suggestions as you rank',
    icon: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  },
  {
    id: 'insights',
    title: 'Listening insights',
    description: 'Understand patterns in what you love',
    icon: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  },
] as const;

const COMPARISONS_PER_SONG = 3.5;
const SECONDS_PER_COMPARISON = 22;

export function estimateRankingMinutes(songCount: number): string {
  if (songCount <= 0) return '~0 min';
  const minutes = Math.ceil((songCount * COMPARISONS_PER_SONG * SECONDS_PER_COMPARISON) / 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `~${hours}h ${remainder}m` : `~${hours}h`;
}

export function formatSongCount(count: number): string {
  if (count === 1) return '1 song';
  return `${count} songs`;
}
