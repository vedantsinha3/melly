import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { NeighborSong } from '@/lib/songDetail';

type Props = {
  neighbors: {
    above: NeighborSong | null;
    below: NeighborSong | null;
    current: NeighborSong;
  };
  onSongPress: (ratingId: string) => void;
};

function NeighborTile({
  song,
  role,
  highlighted,
  onPress,
}: {
  song: NeighborSong;
  role: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, motion } = getTheme(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.tile,
        {
          backgroundColor: highlighted ? colors.accentSoft : colors.surfaceMuted,
          borderRadius: radius.lg,
          borderColor: highlighted ? colors.accent : colors.border,
          borderWidth: highlighted ? 1.5 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.9 : 1,
          ...(Platform.OS === 'web' && hovered
            ? { borderColor: colors.accentMuted, transform: [{ translateY: -1 }] }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      <Text variant="caption" tone="tertiary">
        {role}
      </Text>
      <Image
        source={{ uri: song.artworkUrl ?? undefined }}
        style={[styles.art, { borderRadius: radius.md }]}
        contentFit="cover"
      />
      <Text variant="caption" tone={highlighted ? 'accent' : 'secondary'} numberOfLines={1}>
        #{song.rankPosition}
      </Text>
      <Text variant="label" numberOfLines={2} style={styles.tileTitle}>
        {song.trackName}
      </Text>
      <Text variant="caption" tone="score">
        {song.score.toFixed(1)}
      </Text>
    </Pressable>
  );
}

export function SongRankingNeighborhood({ neighbors, onSongPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  return (
    <View style={{ gap: spacing.sm }}>
      <View>
        <Text variant="heading">Ranking neighborhood</Text>
        <Text variant="caption" tone="tertiary">
          Why this song sits where it does in your library
        </Text>
      </View>

      <Card tone="muted" style={[styles.rail, { gap: spacing.sm, padding: spacing.md }]}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          {neighbors.above ? (
            <NeighborTile
              song={neighbors.above}
              role="Ranked higher"
              onPress={() => onSongPress(neighbors.above!.ratingId)}
            />
          ) : (
            <View style={[styles.tile, styles.emptyTile]}>
              <Text variant="caption" tone="tertiary" style={styles.emptyText}>
                Top of your list
              </Text>
            </View>
          )}

          <NeighborTile
            song={neighbors.current}
            role="This song"
            highlighted
            onPress={() => onSongPress(neighbors.current.ratingId)}
          />

          {neighbors.below ? (
            <NeighborTile
              song={neighbors.below}
              role="Ranked lower"
              onPress={() => onSongPress(neighbors.below!.ratingId)}
            />
          ) : (
            <View style={[styles.tile, styles.emptyTile]}>
              <Text variant="caption" tone="tertiary" style={styles.emptyText}>
                Bottom of your list
              </Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {},
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tile: {
    flex: 1,
    padding: 10,
    gap: 6,
    alignItems: 'center',
    minWidth: 0,
    borderCurve: 'continuous',
  },
  emptyTile: {
    justifyContent: 'center',
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
  },
  art: {
    width: 56,
    height: 56,
    backgroundColor: '#1a1a1a',
  },
  tileTitle: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
  },
});
