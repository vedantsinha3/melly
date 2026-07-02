import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import type { AlbumCollectionStats } from '@/lib/albums';

type Props = {
  stats: AlbumCollectionStats;
};

export function AlbumCollectionHero({ stats }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  const items = [
    { label: 'Completed', value: String(stats.completedCount) },
    { label: 'Exploring', value: String(stats.exploringCount) },
    { label: 'Avg rating', value: stats.averageAlbumRating.toFixed(1) },
    { label: 'Hours ranked', value: stats.hoursRanked.toFixed(1) },
  ];

  return (
    <Card elevated style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="heading">Your collection</Text>
        <Text variant="bodySmall" tone="secondary">
          {stats.highestRatedAlbum
            ? `Top album: ${stats.highestRatedAlbum.title} (${stats.highestRatedAlbum.score.toFixed(1)})`
            : 'Start ranking albums to build your collection.'}
        </Text>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.label}
            style={[styles.stat, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.sm }]}>
            <Text variant="metricSm">{item.value}</Text>
            <Text variant="caption" tone="secondary">
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 2 }}>
        {stats.favoriteArtist ? (
          <Text variant="caption" tone="secondary">
            Favorite artist · {stats.favoriteArtist}
          </Text>
        ) : null}
        {stats.mostCompletedArtist ? (
          <Text variant="caption" tone="tertiary">
            Most completed · {stats.mostCompletedArtist}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    flex: 1,
    minWidth: 100,
    gap: 2,
  },
});
