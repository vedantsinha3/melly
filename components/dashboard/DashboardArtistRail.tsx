import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, MediaCard, Text } from '@/components/ui';
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

export function DashboardArtistRail({ artists, lowData, expanded = false }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing, artwork } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWide = width >= layout.breakpointWide;

  const useGrid = expanded && isWide && artists.length > 0;

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
            { gap: spacing.md, paddingTop: spacing.xs },
            useGrid ? styles.grid : styles.rail,
          ]}>
          {artists.map((artist, index) => (
            <Animated.View
              key={artist.name}
              entering={FadeInDown.delay(index * 55).duration(260).springify().damping(20)}
              style={useGrid ? styles.gridCell : undefined}>
              <MediaCard
                imageUrl={artist.artworkUrl}
                title={artist.name}
                fill={useGrid}
                size={useGrid ? undefined : artwork.xl}
                onPress={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                footer={
                  <View style={styles.metaRow}>
                    <Text variant="caption" style={styles.footerText}>
                      {artist.averageScore.toFixed(1)} avg
                    </Text>
                    <Text variant="caption" style={styles.footerMuted}>
                      · {artist.count} tracks
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
  footerMuted: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
});
