import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  rankedAt: string;
  comparisonCount: number;
  confidencePct: number;
  artistRankLabel: string | null;
};

export function SongJourneyCard({
  rankedAt,
  comparisonCount,
  confidencePct,
  artistRankLabel,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  const dateLabel = new Date(rankedAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const roundsLabel =
    comparisonCount === 0
      ? 'No comparisons needed'
      : comparisonCount === 1
        ? '1 comparison round'
        : `${comparisonCount} comparison rounds`;

  return (
    <Card style={{ gap: spacing.md, padding: spacing.md }}>
      <Text variant="heading">Song journey</Text>
      <View style={[styles.grid, { gap: spacing.sm }]}>
        <JourneyStat label="Date ranked" value={dateLabel} />
        <JourneyStat label="Comparisons" value={roundsLabel} />
        <JourneyStat label="Placement confidence" value={`${confidencePct}%`} accent />
        {artistRankLabel ? (
          <JourneyStat label="Artist rank" value={artistRankLabel} wide />
        ) : null}
      </View>
    </Card>
  );
}

function JourneyStat({
  label,
  value,
  accent,
  wide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.stat, wide && styles.statWide]}>
      <Text variant="caption" tone="tertiary">
        {label}
      </Text>
      <Text variant="label" tone={accent ? 'accent' : 'default'} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    width: '47%',
    minWidth: 120,
    gap: 3,
    flexGrow: 1,
  },
  statWide: {
    width: '100%',
  },
});
