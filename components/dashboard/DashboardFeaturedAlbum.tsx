import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import type { AlbumSummary } from '@/lib/albums';

type Props = {
  album: AlbumSummary;
  onPress: () => void;
  onViewCollection?: () => void;
};

export function DashboardFeaturedAlbum({ album, onPress, onViewCollection }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  return (
    <Card elevated style={{ padding: spacing.md, gap: spacing.sm }}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary">
          Your favorite album
        </Text>
        {onViewCollection ? (
          <Pressable
            onPress={onViewCollection}
            accessibilityRole="button"
            accessibilityLabel="View album collection">
            <Text variant="caption" tone="accent">
              View collection
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${album.title} by ${album.artist}`}
        style={({ pressed, hovered }) => [
          styles.row,
          {
            backgroundColor: album.isComplete ? colors.accentSoft : colors.surfaceMuted,
            borderRadius: radius.lg,
            padding: spacing.sm,
            opacity: pressed ? 0.94 : 1,
            ...(Platform.OS === 'web' && hovered
              ? { borderColor: colors.accentMuted, boxShadow: `0 8px 20px ${colors.shadow}` }
              : null),
            transitionDuration: `${motion.normal}ms`,
          },
        ]}>
        <Image
          source={{ uri: album.artworkUrl ?? undefined }}
          style={[styles.art, { borderRadius: radius.md }]}
          contentFit="cover"
        />
        <View style={styles.copy}>
          <Text variant="label" numberOfLines={2}>
            {album.title}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {album.artist}
          </Text>
          <View style={styles.meta}>
            <Text variant="metricSm" tone="score">
              {album.averageScore.toFixed(1)}
            </Text>
            <Text variant="caption" tone="tertiary">
              · {album.confidenceLabel}
              {album.isComplete ? ' · Completed' : ''}
            </Text>
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderCurve: 'continuous',
  },
  art: {
    width: 72,
    height: 72,
    backgroundColor: '#1a1a1a',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
});
