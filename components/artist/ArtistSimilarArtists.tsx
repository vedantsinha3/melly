import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { SimilarArtist } from '@/lib/artistDetail';

type Props = {
  artistName: string;
  similarArtists: SimilarArtist[];
};

export function ArtistSimilarArtists({ artistName, similarArtists }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);
  const router = useRouter();

  if (similarArtists.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">Similar in your library</Text>
      <Text variant="caption" tone="tertiary">
        Because you rate {artistName} highly, you also rate
      </Text>
      <View style={{ gap: spacing.xs }}>
        {similarArtists.map((artist) => (
          <Pressable
            key={artist.name}
            onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
            style={({ pressed, hovered }) => [
              styles.row,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.md,
                padding: spacing.sm,
                opacity: pressed ? 0.9 : 1,
                ...(Platform.OS === 'web' && hovered ? { backgroundColor: colors.surfaceHover } : null),
                transitionDuration: `${motion.fast}ms`,
              },
            ]}>
            {artist.artworkUrl ? (
              <Image source={{ uri: artist.artworkUrl }} style={[styles.art, { borderRadius: radius.sm }]} />
            ) : (
              <View style={[styles.art, styles.fallback, { backgroundColor: colors.surfaceInset, borderRadius: radius.sm }]}>
                <Text variant="caption" tone="tertiary">
                  {artist.name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text variant="label">{artist.name}</Text>
              <Text variant="caption" tone="tertiary">
                {artist.averageScore.toFixed(1)} avg · {artist.songCount} songs
              </Text>
            </View>
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
  },
  art: {
    width: 36,
    height: 36,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: 1,
  },
});
