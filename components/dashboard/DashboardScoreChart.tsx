import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Bucket = { label: string; count: number };

type Props = {
  scoreBuckets: Bucket[];
  lowData: boolean;
};

const BUCKET_COLORS: Record<string, 'scoreBandHigh' | 'scoreBandMid' | 'scoreBandLow'> = {
  '9-10': 'scoreBandHigh',
  '7-8.9': 'scoreBandMid',
  '<7': 'scoreBandLow',
};

const LABEL_SHORT: Record<string, string> = {
  '9-10': '9–10',
  '7-8.9': '7–8.9',
  '<7': '<7',
};

function AnimatedBar({
  count,
  maxCount,
  color,
  label,
  chartHeight,
  index,
}: {
  count: number;
  maxCount: number;
  color: string;
  label: string;
  chartHeight: number;
  index: number;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius } = getTheme(colorScheme);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 70, withSpring(count === 0 ? 0 : Math.max(count / maxCount, 0.08), {
      damping: 16,
      stiffness: 120,
    }));
  }, [count, maxCount, index, progress]);

  const barStyle = useAnimatedStyle(() => ({
    height: progress.value * chartHeight,
  }));

  return (
    <View style={styles.barColumn}>
      <Text variant="caption" style={styles.barCount}>
        {count}
      </Text>
      <View style={[styles.barTrack, { height: chartHeight, backgroundColor: colors.surface }]}>
        <Animated.View
          style={[
            barStyle,
            {
              width: '100%',
              backgroundColor: color,
              borderTopLeftRadius: radius.sm,
              borderTopRightRadius: radius.sm,
            },
          ]}
        />
      </View>
      <Text variant="caption" tone="tertiary" style={styles.barLabel}>
        {label}
      </Text>
    </View>
  );
}

export function DashboardScoreChart({ scoreBuckets, lowData }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const maxCount = Math.max(...scoreBuckets.map((b) => b.count), 1);
  const chartHeight = 108;

  return (
    <Card tone="inset" padded style={{ gap: spacing.sm, flex: 1 }}>
      <Text variant="heading">Score distribution</Text>

      {lowData ? (
        <Text variant="bodySmall" tone="secondary">
          Rank a few more songs to unlock your distribution chart.
        </Text>
      ) : (
        <View style={[styles.chart, { height: chartHeight + 44 }]}>
          <View style={styles.bars}>
            {scoreBuckets.map((bucket, index) => (
              <AnimatedBar
                key={bucket.label}
                count={bucket.count}
                maxCount={maxCount}
                color={colors[BUCKET_COLORS[bucket.label] ?? 'score']}
                label={LABEL_SHORT[bucket.label] ?? bucket.label}
                chartHeight={chartHeight}
                index={index}
              />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: {
    paddingTop: 4,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    flex: 1,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    maxWidth: 72,
  },
  barCount: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    fontSize: 11,
  },
  barTrack: {
    width: '68%',
    justifyContent: 'flex-end',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
});
