import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RectangleProps, TooltipContentProps } from 'recharts';

import { Card, Text } from '@/components/ui';
import { TasteProfileSummary } from '@/components/dashboard/TasteProfileSummary';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  brightenHexColor,
  getHistogramChartMaxPct,
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

type ChartRow = HistogramBucket & {
  fill: string;
};

type BarShapeProps = RectangleProps & {
  index?: number;
};

const CHART_HEIGHT = 300;

function HistogramTooltip(props: TooltipContentProps<number, string>) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;

  const row = payload[0].payload as ChartRow;
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, spacing } = getTheme(colorScheme);

  return (
    <View
      style={[
        styles.tooltip,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          boxShadow: `0 4px 14px ${colors.shadow}`,
        },
      ]}>
      <Text variant="label" style={styles.tooltipRating}>
        Rating {row.rating}
      </Text>
      <Text variant="caption" tone="secondary">
        {row.pct.toFixed(1)}% of library
      </Text>
      {row.count > 0 ? (
        <Text variant="caption" tone="tertiary">
          {row.count} {row.count === 1 ? 'song' : 'songs'}
        </Text>
      ) : null}
    </View>
  );
}

function StaggeredBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  hovered,
  baseFill = '#169C46',
}: BarShapeProps & { hovered?: boolean; baseFill?: string }) {
  const fill = hovered ? brightenHexColor(baseFill, 0.18) : baseFill;
  const cornerRadius = Math.min(5, width / 4);

  if (height <= 0) {
    return null;
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={cornerRadius}
        ry={cornerRadius}
        style={{ transition: 'fill 200ms ease-out' }}
      />
      <animate
        attributeName="height"
        from="0"
        to={height}
        dur="0.6s"
        begin={`${index * 0.04}s`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        keyTimes="0;1"
      />
      <animate
        attributeName="y"
        from={y + height}
        to={y}
        dur="0.6s"
        begin={`${index * 0.04}s`}
        fill="freeze"
        calcMode="spline"
        keySplines="0.22 1 0.36 1"
        keyTimes="0;1"
      />
    </g>
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
  const [mounted, setMounted] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo<ChartRow[]>(
    () =>
      histogram.map((bucket) => ({
        ...bucket,
        fill: getScoreBarColor(bucket.rating, colorScheme),
      })),
    [histogram, colorScheme],
  );

  const chartMaxPct = useMemo(() => getHistogramChartMaxPct(histogram), [histogram]);

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
          <View style={styles.chart}>
            {mounted ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart
                  data={data}
                  margin={{ top: 12, right: 4, left: 0, bottom: 2 }}
                  barCategoryGap="18%"
                  onMouseLeave={() => setHoveredRating(null)}>
                  <XAxis
                    dataKey="rating"
                    type="number"
                    domain={[0.5, 10.5]}
                    ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                    tickLine={false}
                    axisLine={{ stroke: colors.separator, strokeWidth: 1 }}
                    tick={{ fill: colors.textTertiary, fontSize: 10, fontWeight: 400 }}
                    dy={5}
                    allowDecimals={false}
                  />
                  <YAxis hide domain={[0, chartMaxPct]} />
                  <ReferenceLine y={0} stroke={colors.separator} strokeWidth={1} />
                  {averageScore > 0 ? (
                    <ReferenceLine
                      x={averageScore}
                      stroke={colors.textTertiary}
                      strokeDasharray="4 5"
                      strokeWidth={1}
                      strokeOpacity={0.55}
                      ifOverflow="extendDomain"
                      label={{
                        value: `Avg ${averageScore.toFixed(1)}`,
                        position: 'insideTopLeft',
                        fill: colors.textTertiary,
                        fontSize: 10,
                        fontWeight: 500,
                        offset: 6,
                      }}
                    />
                  ) : null}
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}
                    content={(props) => (
                      <HistogramTooltip {...(props as TooltipContentProps<number, string>)} />
                    )}
                    animationDuration={180}
                    wrapperStyle={{ outline: 'none', transition: 'opacity 180ms ease-out' }}
                  />
                  <Bar
                    dataKey="pct"
                    isAnimationActive={false}
                    onMouseEnter={(_state, index) => {
                      const row = data[index];
                      if (row) setHoveredRating(row.rating);
                    }}
                    shape={(props) => {
                      const barProps = props as BarShapeProps;
                      const index = barProps.index ?? 0;
                      const entry = data[index];
                      return (
                        <StaggeredBar
                          {...barProps}
                          index={index}
                          hovered={hoveredRating === entry?.rating}
                          baseFill={entry?.fill}
                        />
                      );
                    }}>
                    {data.map((entry) => (
                      <Cell key={entry.rating} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </View>

          <TasteProfileSummary profile={profile} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 360,
  },
  title: {
    marginBottom: 4,
  },
  chart: {
    width: '100%',
    height: CHART_HEIGHT,
    marginHorizontal: -4,
  },
  tooltip: {
    gap: 3,
    minWidth: 108,
  },
  tooltipRating: {
    fontWeight: '600',
    fontSize: 13,
  },
});
