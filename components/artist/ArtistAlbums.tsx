import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { ArtistAlbum } from '@/lib/artistDetail';

type Props = {
  albums: ArtistAlbum[];
  onSongPress: (ratingId: string) => void;
};

export function ArtistAlbums({ albums, onSongPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  if (albums.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">Albums</Text>
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {albums.map((album) => (
          <Pressable
            key={album.name}
            onPress={() => onSongPress(album.bestSong.ratingId)}
            style={({ pressed, hovered }) => [
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderColor: colors.border,
                padding: spacing.sm,
                opacity: pressed ? 0.92 : 1,
                ...(Platform.OS === 'web' && hovered
                  ? { borderColor: colors.accentMuted, boxShadow: `0 4px 14px ${colors.shadow}` }
                  : null),
                transitionDuration: `${motion.fast}ms`,
              },
            ]}>
            <Image
              source={{ uri: album.artworkUrl ?? undefined }}
              style={[styles.art, { borderRadius: radius.md }]}
              contentFit="cover"
            />
            <View style={styles.meta}>
              <Text variant="label" numberOfLines={1}>
                {album.name}
              </Text>
              <Text variant="caption" tone="secondary">
                {album.averageScore.toFixed(1)} avg · {album.songCount}{' '}
                {album.songCount === 1 ? 'song' : 'songs'}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                Best: {album.bestSong.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '48%',
    minWidth: 200,
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  art: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
  },
  meta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
