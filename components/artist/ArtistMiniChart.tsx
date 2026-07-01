import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { getScoreBarColor, type HistogramBucket } from '@/lib/scoreHistogram';

type Props = {
  artistName: string;
  histogram: HistogramBucket[];
  chartMaxPct: number;
  artistAverage: number;
  overallAverage: number;
};

const CHART_HEIGHT = 120;

function MiniBar({
  bucket,
  chartMaxPct,
  index,
}: {
  bucket: HistogramBucket;
  chartMaxPct: number;
  index: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { radius } = getTheme(colorScheme);
  const progress = useSharedValue(0);
  const fill = getScoreBarColor(bucket.rating, colorScheme);
  const target =
    bucket.pct === 0 ? 0 : Math.max((bucket.pct / chartMaxPct) * 0.94, bucket.pct > 0 ? 0.06 : 0);

  useEffect(() => {
    progress.value = withDelay(index * 30, withTiming(target, { duration: 500 }));
  }, [bucket.pct, chartMaxPct, index, progress, target]);

  const barStyle = useAnimatedStyle(() => ({
    height: progress.value * CHART_HEIGHT,
  }));

  return (
    <View style={styles.barCol}>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            barStyle,
            {
              width: '100%',
              backgroundColor: fill,
              borderTopLeftRadius: radius.sm,
              borderTopRightRadius: radius.sm,
            },
          ]}
        />
      </View>
      <Text variant="caption" tone="tertiary" style={styles.label}>
        {bucket.rating}
      </Text>
    </View>
  );
}

export function ArtistMiniChart({
  artistName,
  histogram,
  chartMaxPct,
  artistAverage,
  overallAverage,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const delta = artistAverage - overallAverage;
  const deltaLabel =
    Math.abs(delta) < 0.1
      ? 'Matches your library average'
      : delta > 0
        ? `${delta.toFixed(1)} above your library average`
        : `${Math.abs(delta).toFixed(1)} below your library average`;

  return (
    <Card tone="inset" style={{ gap: spacing.sm, padding: spacing.md }}>
      <View style={styles.header}>
        <Text variant="heading">How you rate {artistName}</Text>
        <Text variant="caption" tone="tertiary">
          % of this artist&apos;s ranked songs
        </Text>
      </View>

      <View style={[styles.chart, { height: CHART_HEIGHT + 20 }]}>
        <View style={[styles.baseline, { backgroundColor: colors.separator }]} />
        <View style={styles.bars}>
          {histogram.map((bucket, index) => (
            <MiniBar key={bucket.rating} bucket={bucket} chartMaxPct={chartMaxPct} index={index} />
          ))}
        </View>
      </View>

      <View style={[styles.compareRow, { backgroundColor: colors.surfaceMuted, borderRadius: 10 }]}>
        <Text variant="caption" tone="secondary" style={styles.compareLine}>
          Artist avg <Text variant="label" tone="accent">{artistAverage.toFixed(1)}</Text>
          {'  vs  '}
          Library avg <Text variant="label">{overallAverage.toFixed(1)}</Text>
        </Text>
      </View>
      <Text variant="caption" tone="secondary" style={styles.delta}>
        {deltaLabel}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 2,
  },
  chart: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    height: StyleSheet.hairlineWidth,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 16,
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  barTrack: {
    width: '84%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
  },
  label: {
    fontSize: 9,
  },
  compareRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  compareLine: {
    textAlign: 'center',
  },
  delta: {
    textAlign: 'center',
  },
});
