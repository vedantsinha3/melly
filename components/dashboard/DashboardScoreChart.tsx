import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import { TasteProfileSummary } from '@/components/dashboard/TasteProfileSummary';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  getScoreBarColor,
  type HistogramBucket,
  type TasteProfileModule,
} from '@/lib/scoreHistogram';

type Props = {
  histogram: HistogramBucket[];
  averageScore: number;
  profile: TasteProfileModule | null;
  lowData: boolean;
};

const CHART_HEIGHT = 150;

function AnimatedBar({
  bucket,
  maxCount,
  chartHeight,
  index,
}: {
  bucket: HistogramBucket;
  maxCount: number;
  chartHeight: number;
  index: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius } = getTheme(colorScheme);
  const progress = useSharedValue(0);
  const fill = getScoreBarColor(bucket.rating, colorScheme);
  const target =
    bucket.count === 0 ? 0 : Math.max(bucket.count / maxCount, bucket.count > 0 ? 0.05 : 0);

  useEffect(() => {
    progress.value = withDelay(index * 40, withTiming(target, { duration: 600 }));
  }, [bucket.count, maxCount, index, progress, target]);

  const barStyle = useAnimatedStyle(() => ({
    height: progress.value * chartHeight,
  }));

  return (
    <View style={styles.barColumn}>
      <View style={[styles.barTrack, { height: chartHeight, backgroundColor: colors.surface }]}>
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
      <Text variant="caption" tone="tertiary" style={styles.barLabel}>
        {bucket.rating}
      </Text>
    </View>
  );
}

function AverageMarker({ averageScore, chartHeight }: { averageScore: number; chartHeight: number }) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
  const leftPct = ((averageScore - 0.5) / 10) * 100;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.avgLine,
        {
          left: `${leftPct}%`,
          height: chartHeight + 22,
          borderLeftColor: colors.textTertiary,
        },
      ]}>
      <Text variant="caption" tone="tertiary" style={styles.avgLabel}>
        Avg {averageScore.toFixed(1)}
      </Text>
    </View>
  );
}

export function DashboardScoreChart({
  histogram,
  averageScore,
  profile,
  lowData,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const maxCount = Math.max(...histogram.map((bucket) => bucket.count), 1);

  return (
    <Card tone="inset" padded style={[styles.card, { flex: 1, padding: spacing.md }]}>
      <Text variant="heading" style={styles.title}>
        Rating distribution
      </Text>

      {lowData ? (
        <Text variant="bodySmall" tone="secondary">
          Rank a few more songs to unlock your distribution chart.
        </Text>
      ) : (
        <>
          <View style={[styles.chart, { height: CHART_HEIGHT + 44 }]}>
            {averageScore > 0 ? (
              <AverageMarker averageScore={averageScore} chartHeight={CHART_HEIGHT} />
            ) : null}
            <View style={[styles.baseline, { backgroundColor: colors.separator }]} />
            <View style={styles.bars}>
              {histogram.map((bucket, index) => (
                <AnimatedBar
                  key={bucket.rating}
                  bucket={bucket}
                  maxCount={maxCount}
                  chartHeight={CHART_HEIGHT}
                  index={index}
                />
              ))}
            </View>
          </View>

          <TasteProfileSummary profile={profile} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 300,
  },
  title: {
    marginBottom: 4,
  },
  chart: {
    paddingTop: 4,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    height: StyleSheet.hairlineWidth,
  },
  avgLine: {
    position: 'absolute',
    bottom: 18,
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.55,
    zIndex: 1,
  },
  avgLabel: {
    position: 'absolute',
    top: -2,
    left: 4,
    fontSize: 9,
    width: 56,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 18,
    gap: Platform.OS === 'web' ? 3 : 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  barTrack: {
    width: '84%',
    justifyContent: 'flex-end',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
});
