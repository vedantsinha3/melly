import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  DashboardActivityList,
  DashboardArtistRail,
  DashboardFeaturedAlbum,
  DashboardHero,
  DashboardScoreChart,
  DashboardSongRail,
  DashboardToolbar,
} from '@/components/dashboard';
import { EmptyState, LoadingState, Screen, wideScrollContentStyle } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, layout } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { buildAlbumCatalog } from '@/lib/albums';
import { buildDashboardViewModel } from '@/lib/dashboard';
import { fetchRankedRatings } from '@/lib/ranking';
import { getSpotifyArtistImageUrl } from '@/lib/spotify';
import type { RatingWithTrack } from '@/types';

type UserMeta = {
  full_name?: string;
  name?: string;
};

function toDisplayName(value?: string | null) {
  if (!value) return '';
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDisplayName(user?: { email?: string | null; user_metadata?: UserMeta } | null) {
  const metadataName = toDisplayName(user?.user_metadata?.full_name ?? user?.user_metadata?.name);
  if (metadataName) return metadataName;

  const emailLocalPart = user?.email?.split('@')[0];
  const emailName = toDisplayName(emailLocalPart);
  if (emailName) return emailName;

  return 'Friend';
}

export default function RankedListScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpointWide;
  const { user, requestSignOut, isSpotifyUser } = useAuth();
  const { getProgress, isActive } = useImportQueue();
  const router = useRouter();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [artistProfileImages, setArtistProfileImages] = useState<Record<string, string | null>>({});

  const loadRatings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchRankedRatings(user.id);
      setRatings(data);

      // Fetch Spotify artist profile images for the top artists so this rail doesn't just look like more album art.
      const artistCounts = new Map<string, number>();
      for (const rating of data) {
        for (const name of rating.track.artist_names) {
          artistCounts.set(name, (artistCounts.get(name) ?? 0) + 1);
        }
      }

      const topArtistNames = [...artistCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const results = await Promise.all(
        topArtistNames.map(async (name) => [name, await getSpotifyArtistImageUrl(name)] as const),
      );

      setArtistProfileImages((current) => {
        const next = { ...current };
        for (const [name, url] of results) next[name] = url;
        return next;
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadRatings();
    }, [loadRatings]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRatings();
  };

  const queueProgress = getProgress();
  const dashboard = useMemo(
    () =>
      buildDashboardViewModel(ratings, {
        isActive,
        current: queueProgress.current,
        total: queueProgress.total,
      }),
    [ratings, isActive, queueProgress.current, queueProgress.total],
  );

  const displayName = getDisplayName(user);
  const lowData = ratings.length < 3;
  const queueActive = dashboard.rankingHealth.queueProgress.isActive;

  if (loading && ratings.length === 0) {
    return <LoadingState />;
  }

  const featuredAlbum = buildAlbumCatalog(ratings, 'favorite').featuredAlbum;

  const heroBlock = (
    <DashboardHero
      totalRanked={dashboard.summary.totalRanked}
      averageScore={dashboard.summary.averageScore}
      perfectScores={dashboard.summary.perfectScores}
      favoriteArtist={dashboard.summary.favoriteArtist}
      queueActive={queueActive}
      queueCurrent={dashboard.rankingHealth.queueProgress.current}
      queueTotal={dashboard.rankingHealth.queueProgress.total}
    />
  );

  const artistsBlock = (
    <DashboardArtistRail
      artists={dashboard.tasteProfile.topArtists.map((artist) => ({
        ...artist,
        artworkUrl: artistProfileImages[artist.name] ?? artist.artworkUrl,
      }))}
      lowData={lowData}
      expanded={isWide}
    />
  );

  const songsBlock = (
    <DashboardSongRail
      songs={dashboard.tasteProfile.topSongs}
      lowData={lowData}
      expanded={isWide}
    />
  );

  const insightsBlock = (
    <View style={[isWide ? styles.insightsRow : styles.insightsStack, { gap: spacing.md }]}>
      <View style={isWide ? styles.chartCol : undefined}>
        <DashboardScoreChart
          histogram={dashboard.tasteProfile.scoreHistogram}
          averageScore={dashboard.summary.averageScore}
          profile={dashboard.tasteProfile.profile}
          lowData={lowData}
        />
      </View>
      <View style={isWide ? styles.activityCol : undefined}>
        <DashboardActivityList
          items={dashboard.recentActivity.items}
          onPressItem={(ratingId) => router.push(`/song/${ratingId}`)}
          flex={isWide}
        />
      </View>
    </View>
  );

  return (
    <Screen edgeToEdge wide contentStyle={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          wideScrollContentStyle(),
          styles.dashboardContent,
          { gap: spacing.sm, paddingBottom: spacing.xl },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }>
        <DashboardToolbar
          displayName={displayName}
          showSignOut={!isWide}
          onSignOut={requestSignOut}
        />

        {ratings.length === 0 ? (
          <View style={{ gap: spacing.sm }}>
            {heroBlock}
            <EmptyState
              title="No songs yet"
              subtitle={
                isSpotifyUser
                  ? 'Use the sidebar to import your top tracks, then start ranking songs.'
                  : 'Use the sidebar to log your first songs and unlock score insights.'
              }
              mark="M"
            />
          </View>
        ) : (
          <>
            {heroBlock}
            {featuredAlbum ? (
              <DashboardFeaturedAlbum
                album={featuredAlbum}
                onPress={() => router.push(`/album/${encodeURIComponent(featuredAlbum.key)}`)}
                onViewCollection={() => router.push('/(tabs)/albums')}
              />
            ) : null}
            {artistsBlock}
            {songsBlock}
            {insightsBlock}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  dashboardContent: {
    flexGrow: 1,
  },
  insightsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  insightsStack: {},
  chartCol: {
    flex: 0.4,
    minWidth: 0,
  },
  activityCol: {
    flex: 0.6,
    minWidth: 0,
  },
});
