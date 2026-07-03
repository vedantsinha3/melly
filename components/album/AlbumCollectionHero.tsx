import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, Card, Pill, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, layout } from '@/constants/theme';
import type { AlbumCollectionStats, AlbumSummary } from '@/lib/albums';

import { AlbumProgressBar } from './AlbumProgressBar';

type Props = {
  stats: AlbumCollectionStats;
  featuredAlbum: AlbumSummary | null;
  onViewAlbum: (key: string) => void;
};

function confidenceTone(level: AlbumSummary['confidenceLevel']): 'accent' | 'secondary' | 'tertiary' {
  if (level === 'high') return 'accent';
  if (level === 'medium') return 'secondary';
  return 'tertiary';
}

export function AlbumCollectionHero({ stats, featuredAlbum, onViewAlbum }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion, elevation } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpointWide;

  const statItems = [
    { label: 'Albums completed', value: String(stats.completedCount) },
    { label: 'Albums exploring', value: String(stats.exploringCount) },
    { label: 'Average rating', value: stats.averageAlbumRating.toFixed(1) },
    { label: 'Hours ranked', value: stats.hoursRanked.toFixed(1) },
  ];

  return (
    <Card elevated style={{ padding: spacing.lg, gap: spacing.lg, overflow: 'hidden' }}>
      <Text variant="overline" tone="tertiary">
        Your collection
      </Text>

      {featuredAlbum ? (
        <Pressable
          onPress={() => onViewAlbum(featuredAlbum.key)}
          style={({ pressed, hovered }) => [
            styles.featured,
            isWide && styles.featuredWide,
            {
              backgroundColor: featuredAlbum.isComplete ? colors.accentSoft : colors.surfaceMuted,
              borderColor: featuredAlbum.isComplete ? colors.accentMuted : colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              opacity: pressed ? 0.95 : 1,
              ...(Platform.OS === 'web' && hovered
                ? {
                    borderColor: colors.accentMuted,
                    boxShadow: `0 14px 32px ${colors.shadow}`,
                    transform: [{ translateY: -2 }],
                  }
                : null),
              transitionDuration: `${motion.normal}ms`,
            },
          ]}>
          <View
            style={[
              styles.artWrap,
              isWide ? styles.artWide : styles.artCompact,
              elevation.card,
              { borderRadius: radius.md, overflow: 'hidden' },
            ]}>
            <Image
              source={{ uri: featuredAlbum.artworkUrl ?? undefined }}
              style={styles.artwork}
              contentFit="cover"
            />
          </View>

          <View style={styles.featuredCopy}>
            <Text variant="caption" tone="accent">
              Your favorite album
            </Text>
            <Text variant="title" numberOfLines={2}>
              {featuredAlbum.title}
            </Text>
            <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
              {featuredAlbum.artist}
            </Text>

            <View style={styles.metaRow}>
              <Text variant="metricSm" tone="score">
                {featuredAlbum.averageScore.toFixed(1)}
              </Text>
              <Text variant="caption" tone="secondary">
                average
              </Text>
            </View>

            <Text variant="caption" tone={confidenceTone(featuredAlbum.confidenceLevel)}>
              {featuredAlbum.confidenceLabel}
            </Text>

            {featuredAlbum.isComplete ? (
              <Pill variant="success" label={featuredAlbum.completionStatus} />
            ) : featuredAlbum.completionPct != null ? (
              <View style={{ gap: 4, width: '100%' }}>
                <AlbumProgressBar
                  completionPct={featuredAlbum.completionPct}
                  isComplete={false}
                  showLabel
                  height={7}
                />
              </View>
            ) : (
              <Text variant="caption" tone="secondary">
                {featuredAlbum.rankedCount} song{featuredAlbum.rankedCount === 1 ? '' : 's'} ranked
              </Text>
            )}

            <Button
              title="View album"
              size="sm"
              variant="secondary" 
              onPress={() => onViewAlbum(featuredAlbum.key)}
            />
          </View>
        </Pressable>
      ) : (
        <View style={[styles.emptyFeatured, { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg }]}>
          <Text variant="bodySmall" tone="secondary">
            Rank songs from albums or EPs to discover your favorite.
          </Text>
        </View>
      )}

      <View style={styles.statsSection}>
        <Text variant="caption" tone="tertiary">
          Collection overview
        </Text>
        <View style={styles.statsGrid}>
          {statItems.map((item) => (
            <View
              key={item.label}
              style={[
                styles.stat,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.sm },
              ]}>
              <Text variant="metricSm">{item.value}</Text>
              <Text variant="caption" tone="secondary">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {stats.favoriteArtist || stats.mostCompletedArtist ? (
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
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  featured: {
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  featuredWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  artWrap: {
    backgroundColor: '#1a1a1a',
    alignSelf: 'center',
  },
  artCompact: {
    width: 200,
    height: 200,
  },
  artWide: {
    width: 180,
    height: 180,
    flexShrink: 0,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  featuredCopy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  emptyFeatured: {
    padding: 20,
  },
  statsSection: {
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    flex: 1,
    minWidth: 120,
    gap: 2,
  },
});
