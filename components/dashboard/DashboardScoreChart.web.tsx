import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';

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

export function DashboardScoreChart({ scoreBuckets, lowData }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(
    () =>
      scoreBuckets.map((bucket) => ({
        name: LABEL_SHORT[bucket.label] ?? bucket.label,
        count: bucket.count,
        fill: colors[BUCKET_COLORS[bucket.label] ?? 'score'],
      })),
    [scoreBuckets, colors],
  );

  return (
    <Card tone="inset" padded style={{ gap: spacing.sm, flex: 1 }}>
      <Text variant="heading">Score distribution</Text>

      {lowData ? (
        <Text variant="bodySmall" tone="secondary">
          Rank a few more songs to unlock your distribution chart.
        </Text>
      ) : (
        <View style={styles.chart}>
          <ResponsiveContainer width="100%" height={148}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }} barCategoryGap="22%">
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.textTertiary, fontSize: 11, fontWeight: 500 }}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: colors.textTertiary, fontSize: 10 }}
                width={28}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                isAnimationActive={mounted}
                animationBegin={0}
                animationDuration={520}
                animationEasing="ease-out">
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: {
    width: '100%',
    marginTop: 4,
  },
});
