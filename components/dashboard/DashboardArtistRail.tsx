import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Artist = {
  name: string;
  count: number;
  averageScore: number;
  artworkUrl: string | null;
};

type Props = {
  artists: Artist[];
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

function ArtistCard({ artist, index, size, onPress }: { artist: Artist; index: number; size?: number; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, motion } = getTheme(colorScheme);
  const dimensionStyle = size ? { width: size, height: size } : styles.fill;

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(260).springify().damping(20)} style={size ? undefined : styles.fill}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${artist.name} taste profile`}
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
        {artist.artworkUrl ? (
          <Image source={{ uri: artist.artworkUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: colors.surfaceInset }]}>
            <Text variant="title" tone="tertiary">
              {artist.name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={[styles.scrim, scrimStyle(radius.lg)]} />
        <View style={styles.meta}>
          <Text variant="label" numberOfLines={1} style={styles.artistName}>
            {artist.name}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="caption" style={styles.rating}>
              {artist.averageScore.toFixed(1)} avg
            </Text>
            <Text variant="caption" style={styles.tracks}>
              · {artist.count} tracks
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function DashboardArtistRail({ artists, lowData, expanded = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= layout.breakpointWide;

  const useGrid = expanded && isWide && artists.length > 0;
  const gridGap = spacing.md;

  return (
    <Card tone="muted" padded style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
      <View style={styles.header}>
        <Text variant="heading">Top artists</Text>
        <Text variant="caption" tone="tertiary">
          Your most-ranked
        </Text>
      </View>

      {lowData ? (
        <Text variant="bodySmall" tone="secondary">
          Keep ranking to surface your most-played artists.
        </Text>
      ) : (
        <View
          style={[
            styles.container,
            { gap: gridGap, paddingTop: spacing.xs },
            useGrid ? styles.grid : styles.rail,
          ]}>
          {artists.map((artist, index) =>
            useGrid ? (
              <View key={artist.name} style={styles.gridCell}>
                <ArtistCard
                  artist={artist}
                  index={index}
                  onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                />
              </View>
            ) : (
              <ArtistCard
                key={artist.name}
                artist={artist}
                index={index}
                size={CARD_SIZE}
                onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
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
    height: '34%',
  },
  meta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  artistName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rating: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    fontSize: 11,
  },
  tracks: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
});
