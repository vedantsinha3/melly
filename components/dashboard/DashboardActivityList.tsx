import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type ActivityItem = {
  ratingId: string;
  trackName: string;
  artists: string;
  artworkUrl: string | null;
  score: number;
  rankedAt: string;
};

type Props = {
  items: ActivityItem[];
  onPressItem: (ratingId: string) => void;
  flex?: boolean;
};

function scoreColor(score: number, colors: ReturnType<typeof getTheme>['colors']) {
  if (score >= 9) return colors.scoreBandHigh;
  if (score >= 7) return colors.scoreBandMid;
  return colors.scoreBandLow;
}

export function DashboardActivityList({ items, onPressItem, flex }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  if (items.length === 0) return null;

  return (
    <Card
      tone="default"
      padded={false}
      style={[{ gap: spacing.xs, paddingVertical: spacing.sm }, flex ? styles.flex : null]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.sm }]}>
        <Text variant="heading">Recent activity</Text>
        <Text variant="caption" tone="tertiary">
          {items.length} latest
        </Text>
      </View>

      <View style={flex ? styles.flex : undefined}>
        {items.map((item, index) => (
          <Pressable
            key={item.ratingId}
            onPress={() => onPressItem(item.ratingId)}
            style={({ pressed, hovered }) => [
              styles.row,
              {
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm + 2,
                backgroundColor:
                  pressed || (Platform.OS === 'web' && hovered) ? colors.surfaceMuted : 'transparent',
                transitionDuration: `${motion.fast}ms`,
              },
              index < items.length - 1
                ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }
                : null,
            ]}
            accessibilityRole="button">
            <Image
              source={{ uri: item.artworkUrl ?? undefined }}
              style={[styles.artwork, { borderRadius: radius.sm }]}
              contentFit="cover"
            />
            <View style={styles.track}>
              <Text variant="body" numberOfLines={1} style={styles.trackName}>
                {item.trackName}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {item.artists}
              </Text>
            </View>
            <Text
              variant="metricSm"
              style={{ color: scoreColor(item.score, colors), fontVariant: ['tabular-nums'], fontSize: 15 }}>
              {item.score.toFixed(1)}
            </Text>
            <Text variant="caption" tone="tertiary" style={styles.date}>
              {new Date(item.rankedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  artwork: {
    width: 52,
    height: 52,
    backgroundColor: '#1a1a1a',
  },
  track: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  trackName: {
    fontWeight: '500',
  },
  date: {
    width: 34,
    textAlign: 'right',
    fontSize: 11,
  },
});
