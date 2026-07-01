import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
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

  const hasSupporting = hero.supportingArtworkUrls.length > 0;

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

      <View style={[styles.inner, { padding: spacing.lg, gap: spacing.lg }]}>
        <View style={[styles.artPanel, { borderRadius: radius.lg }]}>
          {hero.artworkUrl ? (
            <View style={styles.asymmetric}>
              <Image
                source={{ uri: hero.artworkUrl }}
                style={[styles.primaryArt, hasSupporting && styles.primaryArtSplit]}
                contentFit="cover"
              />
              {hasSupporting ? (
                <View style={styles.supportingCol}>
                  {hero.supportingArtworkUrls.map((url, index) => (
                    <Image
                      key={`${url}-${index}`}
                      source={{ uri: url }}
                      style={styles.supportingArt}
                      contentFit="cover"
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.fallback, { backgroundColor: colors.accentSoft }]}>
              <Text variant="display" tone="accent">
                {artistName.charAt(0)}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.artScrim,
              {
                borderRadius: radius.lg,
                backgroundColor: colors.accent,
                opacity: 0.06,
              },
            ]}
          />
        </View>

        <View style={styles.copy}>
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'stretch' : undefined,
  },
  artPanel: {
    width: Platform.OS === 'web' ? 260 : '100%',
    height: Platform.OS === 'web' ? 260 : undefined,
    aspectRatio: Platform.OS === 'web' ? undefined : 1.1,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  },
  asymmetric: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  primaryArt: {
    flex: 1,
    height: '100%',
  },
  primaryArtSplit: {
    flex: 1.55,
  },
  supportingCol: {
    flex: 1,
    gap: 3,
  },
  supportingArt: {
    flex: 1,
    width: '100%',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artScrim: {
    ...StyleSheet.absoluteFill,
  },
  copy: {
    flex: 1,
    gap: 10,
    minWidth: 0,
    justifyContent: 'center',
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
    gap: 10,
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
