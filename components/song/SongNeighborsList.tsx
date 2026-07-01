import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { NeighborSong } from '@/lib/songDetail';

type Props = {
  songs: NeighborSong[];
  currentRank: number;
  onSongPress: (ratingId: string) => void;
};

export function SongNeighborsList({ songs, currentRank, onSongPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  if (songs.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <View>
        <Text variant="heading">Close in your rankings</Text>
        <Text variant="caption" tone="tertiary">
          Songs ranked nearest to #{currentRank}
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        {songs.map((song) => (
          <Pressable
            key={song.ratingId}
            onPress={() => onSongPress(song.ratingId)}
            style={({ pressed, hovered }) => [
              styles.row,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderColor: colors.border,
                padding: spacing.sm,
                opacity: pressed ? 0.9 : 1,
                ...(Platform.OS === 'web' && hovered
                  ? { borderColor: colors.accentMuted, backgroundColor: colors.surfaceHover }
                  : null),
                transitionDuration: `${motion.fast}ms`,
              },
            ]}>
            <Text variant="caption" tone="tertiary" style={styles.rank}>
              #{song.rankPosition}
            </Text>
            <Image
              source={{ uri: song.artworkUrl ?? undefined }}
              style={[styles.art, { borderRadius: radius.sm }]}
              contentFit="cover"
            />
            <View style={styles.meta}>
              <Text variant="label" numberOfLines={1}>
                {song.trackName}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {song.artistNames}
              </Text>
            </View>
            <Text variant="label" tone="score">
              {song.score.toFixed(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  rank: {
    width: 36,
    fontWeight: '600',
  },
  art: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
