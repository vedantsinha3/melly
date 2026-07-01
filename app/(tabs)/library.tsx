import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { RankedListItem } from '@/components/RankedListItem';
import { DashboardToolbar } from '@/components/dashboard';
import { EmptyState, LoadingState, Screen, Text, wideScrollContentStyle } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
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

export default function LibraryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user, requestSignOut, isSpotifyUser } = useAuth();
  const router = useRouter();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return <LoadingState />;
  }

  const displayName = getDisplayName(user);

  return (
    <Screen edgeToEdge wide contentStyle={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          wideScrollContentStyle(),
          styles.content,
          { gap: spacing.sm, paddingBottom: spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRatings();
            }}
            tintColor={colors.accent}
          />
        }>
        <DashboardToolbar
          displayName={displayName}
          showImport={isSpotifyUser}
          onImport={() => router.push('/(tabs)/import')}
          showSignOut
          onSignOut={requestSignOut}
        />

        <View style={[styles.listSection, { gap: spacing.sm }]}>
          <Text variant="heading">Your library</Text>
          <Text variant="caption" tone="secondary">
            All ranked songs in order.
          </Text>

          {ratings.length === 0 ? (
            <EmptyState
              title="No songs ranked yet"
              subtitle="Rank songs from Log song and they will appear here."
              ctaTitle="Log a song"
              onPressCta={() => router.push('/(tabs)/search')}
              mark="M"
            />
          ) : (
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
          )}
        </View>
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
  content: {
    flexGrow: 1,
  },
  listSection: {},
});
