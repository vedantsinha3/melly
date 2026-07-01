import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import {
    DashboardActivityList,
    DashboardArtistRail,
    DashboardHero,
    DashboardScoreChart,
    DashboardToolbar,
} from '@/components/dashboard';
import { RankedListItem } from '@/components/RankedListItem';
import { EmptyState, LoadingState, Screen, Text, wideScrollContentStyle } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, layout } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { buildDashboardViewModel } from '@/lib/dashboard';
import { fetchRankedRatings } from '@/lib/ranking';
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
  const { getCurrentTrackId, getProgress, isActive } = useImportQueue();
  const router = useRouter();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullRanking, setShowFullRanking] = useState(false);

  const loadRatings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchRankedRatings(user.id);
      setRatings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
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

  const primaryLabel = queueActive
    ? 'Continue ranking'
    : ratings.length === 0
      ? isSpotifyUser
        ? 'Import tracks'
        : 'Log your first song'
      : 'Log a song';

  const handlePrimaryAction = () => {
    if (ratings.length === 0 && isSpotifyUser) {
      router.push('/onboarding/import');
      return;
    }
    if (queueActive) {
      handleContinueRanking();
      return;
    }
    router.push('/(tabs)/search');
  };

  const handleContinueRanking = () => {
    const trackId = getCurrentTrackId();
    if (trackId) {
      router.push(`/compare/${trackId}`);
      return;
    }
    router.push('/(tabs)/search');
  };

  if (loading) {
    return <LoadingState />;
  }

  const heroBlock = (
    <DashboardHero
      totalRanked={dashboard.summary.totalRanked}
      averageScore={dashboard.summary.averageScore}
      perfectScores={dashboard.summary.perfectScores}
      favoriteArtist={dashboard.summary.favoriteArtist}
      queueActive={queueActive}
      queueCurrent={dashboard.rankingHealth.queueProgress.current}
      queueTotal={dashboard.rankingHealth.queueProgress.total}
      onPrimaryAction={handlePrimaryAction}
      onSecondaryAction={handleContinueRanking}
      primaryLabel={primaryLabel}
    />
  );

  const artistsBlock = (
    <DashboardArtistRail
      artists={dashboard.tasteProfile.topArtists}
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
          showImport={isSpotifyUser}
          onImport={() => router.push('/onboarding/import')}
          onViewRanking={ratings.length > 0 ? () => setShowFullRanking((prev) => !prev) : undefined}
          showFullRanking={showFullRanking}
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
                  ? 'Import your top tracks to start ranking, then log songs one at a time.'
                  : 'Log your first song to unlock score insights and artist trends.'
              }
              ctaTitle={isSpotifyUser ? 'Import Spotify top tracks' : 'Log a song'}
              onPressCta={handlePrimaryAction}
              mark="M"
            />
          </View>
        ) : (
          <>
            {heroBlock}
            {artistsBlock}
            {insightsBlock}

            {showFullRanking ? (
              <View style={[styles.listSection, { gap: spacing.sm, marginTop: spacing.xs }]}>
                <Text variant="heading">Full ranking</Text>
                <FlatList
                  data={ratings}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                  renderItem={({ item }) => (
                    <RankedListItem
                      rating={item}
                      highlighted={item.id === highlight}
                      onPress={() => router.push(`/song/${item.id}`)}
                    />
                  )}
                />
              </View>
            ) : null}
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
  listSection: {},
});
