import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, layout } from '@/constants/theme';
import type { ArtistHeroViewModel, ArtistHighlight } from '@/lib/artistDetail';

type Props = {
  artistName: string;
  hero: ArtistHeroViewModel;
  favoriteSong: ArtistHighlight | null;
  onFavoritePress?: (ratingId: string) => void;
};

function scoreLabel(score: number): string {
  if (score >= 10) return 'Perfect 10.0';
  return score.toFixed(1);
}

export function ArtistHero({ artistName, hero, favoriteSong, onFavoritePress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, elevation } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isSideBySide = width >= layout.breakpointWide || Platform.OS === 'web';

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          overflow: 'hidden',
          ...elevation.card,
        },
      ]}>
      <View
        style={[
          styles.glow,
          { backgroundColor: colors.accentSoft, opacity: colorScheme === 'dark' ? 0.18 : 0.35 },
        ]}
      />

      <View
        style={[
          styles.inner,
          isSideBySide ? styles.innerRow : styles.innerColumn,
          { padding: spacing.lg, gap: spacing.lg },
        ]}>
        <View
          style={[
            styles.artPanel,
            isSideBySide ? styles.artPanelSide : styles.artPanelStacked,
            { borderRadius: radius.lg },
          ]}>
          {hero.artworkUrl ? (
            <Image source={{ uri: hero.artworkUrl }} style={styles.profileArt} contentFit="cover" />
          ) : (
            <View style={[styles.fallback, { backgroundColor: colors.accentSoft }]}>
              <Text variant="display" tone="accent">
                {artistName.charAt(0)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.copy, isSideBySide && styles.copySide]}>
          {hero.achievementTitle ? (
            <View style={styles.achievementBlock}>
              <Text variant="label" tone="accent" style={styles.achievementTitle}>
                {hero.achievementTitle}
              </Text>
              {hero.achievementRankLabel ? (
                <Text variant="caption" tone="tertiary">
                  {hero.achievementRankLabel}
                </Text>
              ) : null}
            </View>
          ) : hero.achievementRankLabel ? (
            <Text variant="caption" tone="tertiary" style={styles.achievementTitle}>
              {hero.achievementRankLabel}
            </Text>
          ) : null}

          <Text variant="display" style={styles.name}>
            {artistName}
          </Text>

          <Text variant="body" tone="secondary" style={styles.insight}>
            {hero.insight}
          </Text>

          <Text variant="bodySmall" tone="tertiary" style={styles.metricLine}>
            {hero.metricLine}
          </Text>

          {favoriteSong ? (
            <Pressable
              onPress={onFavoritePress ? () => onFavoritePress(favoriteSong.ratingId) : undefined}
              disabled={!onFavoritePress}
              accessibilityRole="button"
              accessibilityLabel={`Open ${favoriteSong.name}`}
              style={({ pressed, hovered }) => [
                styles.favoriteCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  borderColor: colors.border,
                  opacity: pressed ? 0.92 : 1,
                  ...(Platform.OS === 'web' && hovered && onFavoritePress
                    ? {
                        backgroundColor: colors.surfaceHover,
                        borderColor: colors.accentMuted,
                        transform: [{ translateY: -1 }],
                      }
                    : null),
                },
              ]}>
              <Text variant="overline" tone="accent" style={styles.favoriteLabel}>
                Favorite Track by {artistName}
              </Text>
              <View style={styles.favoriteRow}>
                {favoriteSong.artworkUrl ? (
                  <Image
                    source={{ uri: favoriteSong.artworkUrl }}
                    style={[styles.favoriteArt, { borderRadius: radius.md }]}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.favoriteArt,
                      styles.favoriteArtFallback,
                      { backgroundColor: colors.surfaceInset, borderRadius: radius.md },
                    ]}>
                    <Text variant="caption" tone="tertiary">
                      ♪
                    </Text>
                  </View>
                )}
                <View style={styles.favoriteMeta}>
                  <Text variant="label" numberOfLines={2}>
                    {favoriteSong.name}
                  </Text>
                  <Text variant="label" tone="score">
                    {scoreLabel(favoriteSong.score)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderCurve: 'continuous',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    height: 180,
  },
  inner: {
    alignItems: 'stretch',
  },
  innerRow: {
    flexDirection: 'row',
  },
  innerColumn: {
    flexDirection: 'column',
  },
  artPanel: {
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  },
  artPanelSide: {
    width: 220,
    alignSelf: 'stretch',
  },
  artPanelStacked: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 280,
    alignSelf: 'center',
  },
  profileArt: {
    ...StyleSheet.absoluteFill,
  },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  copySide: {
    justifyContent: 'flex-start',
  },
  achievementBlock: {
    gap: 2,
  },
  achievementTitle: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  name: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.7,
  },
  insight: {
    lineHeight: 22,
    maxWidth: 520,
  },
  metricLine: {
    lineHeight: 18,
  },
  favoriteCard: {
    marginTop: 6,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  favoriteLabel: {
    letterSpacing: 0.5,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteArt: {
    width: 52,
    height: 52,
  },
  favoriteArtFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteMeta: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
});
