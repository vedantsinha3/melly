import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  perfectScores: number;
  recentRank: { name: string; rankedAt: string } | null;
  artistRankAmong: number | null;
  totalArtists: number;
  libraryPercentile: number;
  librarySharePct: number;
  consistencyScore: number;
};

export function ArtistSecondaryStats({
  perfectScores,
  recentRank,
  artistRankAmong,
  totalArtists,
  libraryPercentile,
  librarySharePct,
  consistencyScore,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  const recentLabel = recentRank
    ? new Date(recentRank.rankedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  const stats: { label: string; value: string; subtitle?: string; accent?: boolean }[] = [];

  if (perfectScores > 0) {
    stats.push({
      label: 'Perfect scores',
      value: String(perfectScores),
      accent: true,
    });
  }

  if (recentRank) {
    stats.push({
      label: 'Recent rank',
      value: recentRank.name,
      subtitle: recentLabel ?? undefined,
    });
  }

  if (artistRankAmong != null && totalArtists > 1) {
    stats.push({
      label: 'Among your artists',
      value: `#${artistRankAmong}`,
      subtitle: `of ${totalArtists} artists`,
    });
  }

  if (totalArtists > 1 && libraryPercentile > 0) {
    stats.push({
      label: 'Library percentile',
      value: `${libraryPercentile}%`,
      subtitle: 'by average score',
    });
  }

  if (librarySharePct > 0) {
    stats.push({
      label: 'Share of library',
      value: `${librarySharePct}%`,
      subtitle: 'of ranked songs',
    });
  }

  if (consistencyScore > 0) {
    stats.push({
      label: 'Consistency',
      value: String(consistencyScore),
      subtitle: 'out of 100',
    });
  }

  if (stats.length === 0) return null;

  return (
    <View style={[styles.grid, { gap: spacing.sm }]}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </View>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  return (
    <Card variant="stat" tone="muted" style={[styles.card, { gap: 4, padding: spacing.md }]}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <Text variant="metricSm" tone={accent ? 'accent' : 'default'} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text variant="caption" tone="tertiary">
          {subtitle}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: '31%',
    minWidth: 108,
    flexGrow: 1,
  },
});
