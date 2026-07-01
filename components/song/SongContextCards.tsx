import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type ArtistContext = {
  name: string;
  averageScore: number;
  songsRanked: number;
};

type AlbumContext = {
  name: string;
  averageScore: number;
  songsRanked: number;
  artworkUrl: string | null;
};

type Props = {
  artist: ArtistContext;
  album: AlbumContext;
  onArtistPress: () => void;
  onAlbumPress: () => void;
};

export function SongContextCards({ artist, album, onArtistPress, onAlbumPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <ContextCard
        label="Artist"
        title={artist.name}
        meta={`${artist.averageScore.toFixed(1)} avg · ${artist.songsRanked} ranked`}
        onPress={onArtistPress}
      />
      <ContextCard
        label="Album"
        title={album.name}
        meta={`${album.averageScore.toFixed(1)} avg · ${album.songsRanked} ranked`}
        artworkUrl={album.artworkUrl}
        onPress={onAlbumPress}
      />
    </View>
  );
}

function ContextCard({
  label,
  title,
  meta,
  artworkUrl,
  onPress,
}: {
  label: string;
  title: string;
  meta: string;
  artworkUrl?: string | null;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: colors.border,
          padding: spacing.md,
          opacity: pressed ? 0.92 : 1,
          ...(Platform.OS === 'web' && hovered
            ? { borderColor: colors.accentMuted, boxShadow: `0 4px 14px ${colors.shadow}` }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <View style={styles.body}>
        {artworkUrl ? (
          <Image source={{ uri: artworkUrl }} style={[styles.art, { borderRadius: radius.sm }]} />
        ) : null}
        <View style={styles.copy}>
          <Text variant="label" numberOfLines={2}>
            {title}
          </Text>
          <Text variant="caption" tone="secondary">
            {meta}
          </Text>
          <Text variant="caption" tone="accent">
            View profile →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    minWidth: 150,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  body: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  art: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a1a',
  },
  copy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
});
