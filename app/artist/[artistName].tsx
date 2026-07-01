import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DetailShell } from '@/components/navigation/DetailShell';
import {
  ArtistAlbums,
  ArtistDetailSkeleton,
  ArtistHero,
  ArtistInsights,
  ArtistMiniChart,
  ArtistNotesHighlights,
  ArtistSecondaryStats,
  ArtistSimilarArtists,
  ArtistSongList,
} from '@/components/artist';
import { EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildArtistDetail,
  sortArtistSongs,
  type ArtistDetailViewModel,
  type ArtistSortMode,
} from '@/lib/artistDetail';
import { fetchRankedRatings } from '@/lib/ranking';

export default function ArtistDetailScreen() {
  const { artistName } = useLocalSearchParams<{ artistName: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpointWide;
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ArtistDetailViewModel | null>(null);
  const [sortMode, setSortMode] = useState<ArtistSortMode>('highest');

  const openSong = useCallback(
    (ratingId: string) => {
      router.push(`/song/${ratingId}`);
    },
    [router],
  );

  const loadArtist = useCallback(async () => {
    if (!user || !artistName) return;

    setLoading(true);
    try {
      const ratings = await fetchRankedRatings(user.id);
      const model = buildArtistDetail(ratings, artistName);
      setDetail(model);
    } catch (error) {
      console.error(error);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [user, artistName]);

  useEffect(() => {
    loadArtist();
  }, [loadArtist]);

  const sortedSongs = useMemo(() => {
    if (!detail) return [];
    return sortArtistSongs(detail.songs, sortMode);
  }, [detail, sortMode]);

  if (loading) {
    return (
      <DetailShell title="Artist">
        <Screen edgeToEdge wide omitSafeArea>
          <ArtistDetailSkeleton />
        </Screen>
      </DetailShell>
    );
  }

  if (!detail) {
    return (
      <DetailShell title="Artist">
        <Screen contentStyle={styles.emptyWrap} omitSafeArea>
        <EmptyState
          mark="♪"
          title="No ranked songs yet"
          subtitle="Rank a few songs by this artist to build their taste profile in Melly."
          ctaTitle="Log a song"
          onPressCta={() => router.push('/(tabs)/search')}
          secondaryTitle="Back to dashboard"
          onPressSecondary={() => router.back()}
        />
        </Screen>
      </DetailShell>
    );
  }

  return (
    <DetailShell title={detail.artistName}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={styles.content}>
      <Animated.View entering={FadeIn.duration(320)} style={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
        <ArtistHero
          artistName={detail.artistName}
          hero={detail.hero}
          favoriteSong={detail.favoriteSong}
          onFavoritePress={openSong}
        />

        <ArtistSecondaryStats
          perfectScores={detail.perfectScores}
          recentRank={detail.recentRank}
          artistRankAmong={detail.artistRankAmong}
          totalArtists={detail.totalArtists}
          libraryPercentile={detail.libraryPercentile}
          librarySharePct={detail.librarySharePct}
          consistencyScore={detail.consistencyScore}
        />

        <View style={isWide ? styles.split : styles.stack}>
          <View style={[styles.mainCol, !isWide && styles.stackSection]}>
            <ArtistInsights insights={detail.insights} />
            <ArtistNotesHighlights
              artistName={detail.artistName}
              notes={detail.noteHighlights}
              onNotePress={openSong}
            />
            <ArtistAlbums albums={detail.albums} onSongPress={openSong} />
            <ArtistSongList
              songs={sortedSongs}
              sortMode={sortMode}
              onSortChange={setSortMode}
              onSongPress={openSong}
            />
            <ArtistSimilarArtists
              artistName={detail.artistName}
              similarArtists={detail.similarArtists}
            />
          </View>
          <View style={isWide ? styles.sideCol : styles.stackSection}>
            <ArtistMiniChart
              artistName={detail.artistName}
              histogram={detail.histogram}
              chartMaxPct={detail.chartMaxPct}
              artistAverage={detail.averageScore}
              overallAverage={detail.overallAverage}
            />
          </View>
        </View>
      </Animated.View>
      </Screen>
    </DetailShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stack: {
    gap: 20,
  },
  mainCol: {
    flex: 1.4,
    minWidth: 0,
    gap: 20,
  },
  stackSection: {
    gap: 20,
  },
  sideCol: {
    flex: 0.9,
    minWidth: 280,
    maxWidth: 380,
  },
});
