import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Song = {
  ratingId: string;
  title: string;
  artist: string;
  score: number;
  rankPosition: number;
  artworkUrl: string | null;
};

type Props = {
  songs: Song[];
  lowData: boolean;
  expanded?: boolean;
};

const CARD_SIZE = 148;

const SCRIM_GRADIENT =
  'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)';

function scrimStyle(borderRadius: number): ViewStyle {
  const base: ViewStyle = {
    borderRadius,
    ...(Platform.OS === 'web'
      ? { backgroundImage: SCRIM_GRADIENT }
      : { experimental_backgroundImage: SCRIM_GRADIENT }),
  };
  return base;
}

function SongCard({ song, index, size, onPress }: { song: Song; index: number; size?: number; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, motion } = getTheme(colorScheme);
  const dimensionStyle = size ? { width: size, height: size } : styles.fill;

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(260).springify().damping(20)} style={size ? undefined : styles.fill}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${song.title} by ${song.artist}`}
        style={({ pressed, hovered }) => [
          styles.card,
          dimensionStyle,
          {
            borderRadius: radius.lg,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.98 : Platform.OS === 'web' && hovered ? 1.015 : 1 }],
            transitionDuration: `${motion.normal}ms`,
            ...(Platform.OS === 'web' && hovered
              ? { boxShadow: '0 10px 28px rgba(0,0,0,0.16)' }
              : null),
          },
        ]}>
        {song.artworkUrl ? (
          <Image source={{ uri: song.artworkUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: colors.surfaceInset }]}>
            <Text variant="title" tone="tertiary">
              {song.title.charAt(0)}
            </Text>
          </View>
        )}
        <View style={[styles.scrim, scrimStyle(radius.lg)]} />
        <View style={styles.meta}>
          <Text variant="label" numberOfLines={2} style={styles.songTitle}>
            {song.title}
          </Text>
          <Text variant="caption" numberOfLines={1} style={styles.artistName}>
            {song.artist}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="caption" style={styles.rank}>
              #{song.rankPosition}
            </Text>
            <Text variant="caption" style={styles.score}>
              · {song.score.toFixed(1)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function DashboardSongRail({ songs, lowData, expanded = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= layout.breakpointWide;

  const useGrid = expanded && isWide && songs.length > 0;
  const gridGap = spacing.md;

  return (
    <Card tone="muted" padded style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
      <View style={styles.header}>
        <Text variant="heading">Top songs</Text>
        <Text variant="caption" tone="tertiary">
          Your highest ranked
        </Text>
      </View>

      {lowData ? (
        <Text variant="bodySmall" tone="secondary">
          Rank a few more songs to fill out your top picks.
        </Text>
      ) : (
        <View
          style={[
            styles.container,
            { gap: gridGap, paddingTop: spacing.xs },
            useGrid ? styles.grid : styles.rail,
          ]}>
          {songs.map((song, index) =>
            useGrid ? (
              <View key={song.ratingId} style={styles.gridCell}>
                <SongCard
                  song={song}
                  index={index}
                  onPress={() => router.push(`/song/${song.ratingId}`)}
                />
              </View>
            ) : (
              <SongCard
                key={song.ratingId}
                song={song}
                index={index}
                size={CARD_SIZE}
                onPress={() => router.push(`/song/${song.ratingId}`)}
              />
            ),
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  container: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 0,
  },
  rail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  meta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  songTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  artistName: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rank: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    fontSize: 11,
  },
  score: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
    fontSize: 11,
  },
});
