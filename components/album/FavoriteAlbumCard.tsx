import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Pill, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import type { AlbumSummary } from '@/lib/albums';

import { AlbumProgressBar } from './AlbumProgressBar';

type Props = {
  album: AlbumSummary;
  onPress: () => void;
};

function confidenceTone(level: AlbumSummary['confidenceLevel']): 'accent' | 'secondary' | 'tertiary' {
  if (level === 'high') return 'accent';
  if (level === 'medium') return 'secondary';
  return 'tertiary';
}

export function FavoriteAlbumCard({ album, onPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion, elevation } = getTheme(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        {
          backgroundColor: album.isComplete ? colors.accentSoft : colors.surface,
          borderColor: album.isComplete ? colors.accentMuted : colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.md,
          opacity: pressed ? 0.94 : 1,
          ...(Platform.OS === 'web' && hovered
            ? {
                borderColor: colors.accentMuted,
                backgroundColor: album.isComplete ? colors.accentSoft : colors.surfaceHover,
                boxShadow: `0 12px 28px ${colors.shadow}`,
                transform: [{ translateY: -3 }],
              }
            : null),
          transitionDuration: `${motion.normal}ms`,
        },
        elevation.subtle,
      ]}>
      <View style={[styles.artWrap, { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.artworkPlaceholder }]}>
        <Image source={{ uri: album.artworkUrl ?? undefined }} style={styles.artwork} contentFit="cover" />
      </View>

      <View style={styles.body}>
        <Text variant="label" numberOfLines={2}>
          {album.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {album.artist}
        </Text>

        <Text variant="caption" tone={confidenceTone(album.confidenceLevel)}>
          {album.confidenceLabel}
        </Text>

        <Text variant="metricSm" tone="score">
          {album.averageScore.toFixed(1)}
        </Text>

        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {album.bestSong.title} · {album.bestSong.score.toFixed(1)}
        </Text>

        {album.isComplete ? (
          <Pill variant="success" label={album.completionStatus} />
        ) : album.completionPct != null ? (
          <AlbumProgressBar completionPct={album.completionPct} isComplete={false} showLabel />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31.8%',
    minWidth: 200,
    maxWidth: 280,
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  artWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  body: {
    gap: 4,
    minWidth: 0,
  },
});
