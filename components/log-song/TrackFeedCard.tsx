import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
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
  const { colors, radius, motion, elevation } = getTheme(colorScheme);
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
      <Image
        source={{ uri: track.album?.images?.[0]?.url ?? undefined }}
        style={[styles.artwork, { borderRadius: radius.md }]}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.meta}>
        <Text variant="label" numberOfLines={2} style={styles.title}>
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
        style={[
          styles.rankBtn,
          {
            backgroundColor: highlighted ? colors.accent : colors.accentSoft,
            borderRadius: radius.pill,
          },
        ]}>
        <Text variant="caption" style={{ color: highlighted ? '#fff' : colors.accent, fontWeight: '600' }}>
          {loading ? '…' : 'Rank'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,
    padding: 10,
    gap: 10,
    borderCurve: 'continuous',
  },
  artwork: {
    width: 136,
    height: 136,
    backgroundColor: '#1a1a1a',
    borderCurve: 'continuous',
  },
  meta: {
    gap: 2,
    minHeight: 52,
  },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  rankBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
