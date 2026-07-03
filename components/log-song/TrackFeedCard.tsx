import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Artwork, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { SpotifySearchTrack } from '@/types';

type Props = {
  track: SpotifySearchTrack;
  meta?: string;
  onPress: () => void;
  loading?: boolean;
  highlighted?: boolean;
};

export function TrackFeedCard({ track, meta, onPress, loading, highlighted }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, motion, elevation, spacing } = getTheme(colorScheme);
  const artists = track.artists?.map((a) => a.name).join(', ') ?? '';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`Rank ${track.name} by ${artists}`}
      style={({ pressed, hovered }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: highlighted ? 2 : 1,
          borderColor: highlighted ? colors.accent : colors.border,
          padding: spacing.sm + 2,
          gap: spacing.sm + 2,
          opacity: loading ? 0.7 : pressed ? 0.92 : 1,
          ...(Platform.OS === 'web' && hovered
            ? {
                transform: [{ scale: 1.02 }],
                boxShadow: `0 10px 28px ${colors.shadow}`,
                borderColor: colors.accent,
              }
            : elevation.subtle),
          transitionDuration: `${motion.normal}ms`,
        },
      ]}>
      <Artwork
        uri={track.album?.images?.[0]?.url}
        size="xl"
        borderRadius="md"
      />
      <View style={[styles.meta, { gap: spacing['2xs'] }]}>
        <Text variant="label" numberOfLines={2}>
          {track.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {artists}
        </Text>
        {meta ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.rankBtn,
          {
            backgroundColor: highlighted ? colors.accent : colors.accentSoft,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.sm + 2,
            paddingVertical: spacing.xs + 2,
          },
        ]}>
        <Text
          variant="caption"
          style={{ color: highlighted ? colors.onAccent : colors.accent, fontWeight: '600' }}>
          {loading ? '…' : 'Rank'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    borderCurve: 'continuous',
  },
  meta: {
    minHeight: 52,
  },
  rankBtn: {
    alignSelf: 'flex-start',
  },
});
