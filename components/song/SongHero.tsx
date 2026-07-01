import { Image } from 'expo-image';
import { Platform, StyleSheet, View } from 'react-native';

import { PreviewPlayer } from '@/components/PreviewPlayer';
import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { RatingWithTrack } from '@/types';

type Props = {
  rating: RatingWithTrack;
  heroSummary: string;
};

function scoreLabel(score: number): string {
  if (score >= 10) return 'Perfect 10.0';
  return score.toFixed(1);
}

export function SongHero({ rating, heroSummary }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, elevation } = getTheme(colorScheme);
  const score = Number(rating.score);

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.lg,
          ...elevation.card,
        },
      ]}>
      <View style={[styles.glow, { backgroundColor: colors.accentSoft, opacity: 0.3 }]} />

      <View style={[styles.inner, { gap: spacing.lg }]}>
        <Image
          source={{ uri: rating.track.album_art_url ?? undefined }}
          style={[styles.artwork, { borderRadius: radius.lg }]}
          contentFit="cover"
        />

        <View style={styles.copy}>
          <Text variant="overline" tone="accent">
            #{rating.rank_position} overall
          </Text>
          <Text variant="display" style={styles.title}>
            {rating.track.name}
          </Text>
          <Text variant="body" tone="secondary">
            {rating.track.artist_names.join(', ')}
          </Text>
          <Text variant="caption" tone="tertiary">
            {rating.track.album_name}
          </Text>

          <View style={[styles.scoreRow, { gap: spacing.sm }]}>
            <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
              <Text variant="metricMd" tone="score">
                {scoreLabel(score)}
              </Text>
            </View>
          </View>

          <Text variant="bodySmall" tone="secondary" style={styles.summary}>
            {heroSummary}
          </Text>

          <PreviewPlayer previewUrl={rating.track.preview_url} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderCurve: 'continuous',
    overflow: 'hidden',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 120,
  },
  inner: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  artwork: {
    width: Platform.OS === 'web' ? 200 : 200,
    height: Platform.OS === 'web' ? 200 : 200,
    backgroundColor: '#1a1a1a',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    gap: 8,
    minWidth: 0,
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  scorePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  summary: {
    lineHeight: 20,
    maxWidth: 480,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
  },
});
