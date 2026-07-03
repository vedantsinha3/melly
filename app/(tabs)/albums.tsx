import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  AlbumCollectionHero,
  ContinueAlbumCard,
  ExploringAlbumCard,
  FavoriteAlbumCard,
} from '@/components/album';
import { DashboardToolbar } from '@/components/dashboard';
import { Button, Chip, EmptyState, LoadingState, Screen, SectionHeader, Text, wideScrollContentStyle } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { buildAlbumCatalog, type AlbumSortMode } from '@/lib/albums';
import { fetchRankedRatings } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

const FAVORITE_PREVIEW_COUNT = 6;

const SORT_OPTIONS: Array<{ value: AlbumSortMode; label: string }> = [
  { value: 'favorite', label: 'Favorite' },
  { value: 'most_completed', label: 'Most completed' },
  { value: 'highest_average', label: 'Highest average' },
  { value: 'needs_ranking', label: 'Needs ranking' },
  { value: 'recently_ranked', label: 'Recently ranked' },
];

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

export default function AlbumsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user, requestSignOut, isSpotifyUser } = useAuth();
  const router = useRouter();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<AlbumSortMode>('favorite');
  const [showAllFavorites, setShowAllFavorites] = useState(false);

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
      loadRatings();
    }, [loadRatings]),
  );

  const catalog = useMemo(() => buildAlbumCatalog(ratings, sortMode), [ratings, sortMode]);
  const showSections = sortMode === 'favorite';
  const visibleFavorites = showAllFavorites
    ? catalog.favoriteAlbums
    : catalog.favoriteAlbums.slice(0, FAVORITE_PREVIEW_COUNT);
  const hasMoreFavorites = catalog.favoriteAlbums.length > FAVORITE_PREVIEW_COUNT;

  const openAlbum = useCallback(
    (key: string) => {
      router.push(`/album/${encodeURIComponent(key)}`);
    },
    [router],
  );

  if (loading && ratings.length === 0) return <LoadingState />;

  return (
    <Screen edgeToEdge wide contentStyle={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          wideScrollContentStyle(),
          styles.content,
          { gap: spacing.lg, paddingBottom: spacing.xl },
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
          displayName={getDisplayName(user)}
          showImport={isSpotifyUser}
          onImport={() => router.push('/(tabs)/import')}
          showSignOut
          onSignOut={requestSignOut}
        />

        <SectionHeader
          title="Favorite albums"
          subtitle="Your curated collection — albums you've truly explored."
        />

        {catalog.sortedAlbums.length > 0 ? (
          <AlbumCollectionHero
            stats={catalog.stats}
            featuredAlbum={catalog.featuredAlbum}
            onViewAlbum={openAlbum}
          />
        ) : null}

        {showSections && catalog.continueAlbum ? (
          <ContinueAlbumCard
            album={catalog.continueAlbum}
            onRankNext={() => openAlbum(catalog.continueAlbum!.key)}
          />
        ) : null}

        <View style={[styles.chips, { gap: spacing.xs }]}>
          {SORT_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              active={sortMode === option.value}
              onPress={() => {
                setSortMode(option.value);
                setShowAllFavorites(false);
              }}
            />
          ))}
        </View>

        {catalog.sortedAlbums.length === 0 ? (
          <EmptyState
            title="No albums yet"
            subtitle="Rank songs from multi-track albums or EPs to start building your collection."
            mark="M"
          />
        ) : showSections ? (
          <View style={{ gap: spacing.lg }}>
            {catalog.favoriteAlbums.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.sectionHead}>
                  <Text variant="heading">Favorite albums</Text>
                  {hasMoreFavorites ? (
                    <Button
                      title={showAllFavorites ? 'Show less' : 'View all'}
                      variant="ghost"
                      size="sm"
                      onPress={() => setShowAllFavorites((value) => !value)}
                    />
                  ) : null}
                </View>
                <View style={[styles.grid, { gap: spacing.md }]}>
                  {visibleFavorites.map((album) => (
                    <FavoriteAlbumCard key={album.key} album={album} onPress={() => openAlbum(album.key)} />
                  ))}
                </View>
              </View>
            ) : null}

            {catalog.exploringAlbums.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <View style={styles.sectionHead}>
                  <Text variant="heading">Albums you&apos;re exploring</Text>
                  <Text variant="caption" tone="tertiary">
                    {catalog.exploringAlbums.length} in progress
                  </Text>
                </View>
                <View style={{ gap: spacing.sm }}>
                  {catalog.exploringAlbums.map((album) => (
                    <ExploringAlbumCard
                      key={album.key}
                      album={album}
                      onPress={() => openAlbum(album.key)}
                      onContinue={() => openAlbum(album.key)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">
              {sortMode === 'needs_ranking'
                ? 'Needs ranking'
                : sortMode === 'highest_average'
                  ? 'Highest average'
                  : sortMode === 'most_completed'
                    ? 'Most completed'
                    : 'Recently ranked'}
            </Text>
            <View style={sortMode === 'needs_ranking' ? styles.list : styles.grid}>
              {catalog.sortedAlbums.map((album) =>
                sortMode === 'needs_ranking' ? (
                  <ExploringAlbumCard
                    key={album.key}
                    album={album}
                    onPress={() => openAlbum(album.key)}
                    onContinue={() => openAlbum(album.key)}
                  />
                ) : (
                  <FavoriteAlbumCard key={album.key} album={album} onPress={() => openAlbum(album.key)} />
                ),
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, width: '100%' },
  content: { flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  list: { gap: 12 },
});
