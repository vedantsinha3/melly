import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, MediaCard, Text } from '@/components/ui';
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

export function DashboardSongRail({ songs, lowData, expanded = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing, artwork } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= layout.breakpointWide;

  const useGrid = expanded && isWide && songs.length > 0;

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
            { gap: spacing.md, paddingTop: spacing.xs },
            useGrid ? styles.grid : styles.rail,
          ]}>
          {songs.map((song, index) => (
            <Animated.View
              key={song.ratingId}
              entering={FadeInDown.delay(index * 55).duration(260).springify().damping(20)}
              style={useGrid ? styles.gridCell : undefined}>
              <MediaCard
                imageUrl={song.artworkUrl}
                title={song.title}
                subtitle={song.artist}
                fill={useGrid}
                size={useGrid ? undefined : artwork.xl}
                onPress={() => router.push(`/song/${song.ratingId}`)}
                footer={
                  <View style={styles.metaRow}>
                    <Text variant="caption" style={styles.footerText}>
                      #{song.rankPosition}
                    </Text>
                    <Text variant="caption" style={styles.footerText}>
                      · {song.score.toFixed(1)}
                    </Text>
                  </View>
                }
              />
            </Animated.View>
          ))}
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    fontSize: 11,
  },
});
