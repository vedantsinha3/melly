import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { DashboardToolbar } from '@/components/dashboard';
import { EmptyState, LoadingState, Screen, Text, wideScrollContentStyle } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  buildAlbumSummaries,
  type AlbumFilterMode,
  type AlbumSortMode,
  type AlbumSummary,
} from '@/lib/albums';
import { fetchRankedRatings } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

const SORT_OPTIONS: Array<{ value: AlbumSortMode; label: string }> = [
  { value: 'highest_rated', label: 'Highest rated' },
  { value: 'most_completed', label: 'Most completed' },
  { value: 'most_ranked', label: 'Most ranked songs' },
  { value: 'recently_ranked', label: 'Recently ranked' },
  { value: 'artist_az', label: 'Artist A-Z' },
];

// const FILTER_OPTIONS: Array<{ value: AlbumFilterMode; label: string }> = [
//   { value: 'all', label: 'All' },
//   { value: 'album', label: 'Albums' },
//   { value: 'ep', label: 'EPs' },
// ];

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
  const { colors, spacing, radius, motion } = getTheme(colorScheme);
  const { user, requestSignOut, isSpotifyUser } = useAuth();
  const router = useRouter();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<AlbumSortMode>('highest_rated');
  const [filterMode, setFilterMode] = useState<AlbumFilterMode>('all');

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

  const albums = useMemo(
    () => buildAlbumSummaries(ratings, sortMode, filterMode, { catalogOnly: true }),
    [ratings, sortMode, filterMode],
  );

  if (loading) return <LoadingState />;

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
          displayName={getDisplayName(user)}
          showImport={isSpotifyUser}
          onImport={() => router.push('/(tabs)/import')}
          showSignOut
          onSignOut={requestSignOut}
        />

        <View style={{ gap: spacing.xs }}>
          <Text variant="heading">Albums</Text>
          <Text variant="bodySmall" tone="secondary">
            Albums and EPs from your ranked library.
          </Text>
        </View>

        <View style={[styles.controls, { gap: spacing.sm }]}>
          <View style={[styles.chips, { gap: spacing.xs }]}>
            {SORT_OPTIONS.map((option) => {
              const active = sortMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSortMode(option.value)}
                  style={({ pressed, hovered }) => [
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
                      borderColor: active ? colors.accentMuted : 'transparent',
                      borderRadius: radius.pill,
                      opacity: pressed ? 0.85 : 1,
                      ...(Platform.OS === 'web' && hovered && !active
                        ? { backgroundColor: colors.surfaceHover }
                        : null),
                      transitionDuration: `${motion.fast}ms`,
                    },
                  ]}>
                  <Text variant="caption" tone={active ? 'accent' : 'secondary'}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {albums.length === 0 ? (
          <EmptyState
            title="No albums yet."
            subtitle="Rank songs from albums or EPs to start building your album rankings."
            mark="M"
          />
        ) : (
          <View style={[styles.grid, { gap: spacing.md }]}>
            {albums.map((album) => (
              <AlbumCard key={album.key} album={album} onPress={() => router.push(`/album/${encodeURIComponent(album.key)}`)} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function AlbumCard({ album, onPress }: { album: AlbumSummary; onPress: () => void }) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  const rankedFraction = album.totalTrackCount ? `${album.rankedCount}/${album.totalTrackCount}` : `${album.rankedCount}`;
  const completion = album.completionPct != null ? `${album.completionPct}% complete` : `${album.rankedCount} ranked`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          opacity: pressed ? 0.92 : 1,
          ...(Platform.OS === 'web' && hovered
            ? { borderColor: colors.accentMuted, boxShadow: `0 8px 20px ${colors.shadow}`, transform: [{ translateY: -1 }] }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      <Image source={{ uri: album.artworkUrl ?? undefined }} style={[styles.artwork, { borderRadius: radius.md }]} contentFit="cover" />
      <View style={{ gap: 3 }}>
        <Text variant="label" numberOfLines={1}>
          {album.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {album.artist}
        </Text>
        <Text variant="caption" tone="secondary">
          {album.averageScore.toFixed(1)} avg · {rankedFraction} songs ranked
        </Text>
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          Best: {album.bestSong.title}
        </Text>
      </View>
      <View style={styles.footerRow}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
          <Text variant="caption" tone="secondary">
            {album.albumTypeBadge}
          </Text>
        </View>
        <Text variant="caption" tone="tertiary">
          {completion}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, width: '100%' },
  content: { flexGrow: 1 },
  controls: {},
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderCurve: 'continuous',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: {
    width: '31.8%',
    minWidth: 240,
    flexGrow: 1,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  artwork: { width: '100%', aspectRatio: 1, backgroundColor: '#1a1a1a' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
});
