import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DetailShell } from '@/components/navigation/DetailShell';
import { Button, Card, EmptyState, LoadingState, Screen, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { buildAlbumDetail, buildAlbumSummaries, type AlbumSummary } from '@/lib/albums';
import { hasExistingRating, fetchRankedRatings } from '@/lib/ranking';
import { buildScoreHistogram, getScoreBarColor } from '@/lib/scoreHistogram';
import { getAlbumTracks, getTrackById, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';

type AlbumTrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  durationMs: number;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function AlbumDetailScreen() {
  const { albumName } = useLocalSearchParams<{ albumName: string }>();
  const albumKey = decodeURIComponent(albumName ?? '');
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);
  const { user, getSpotifyAccessToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allAlbums, setAllAlbums] = useState<AlbumSummary[]>([]);
  const [libraryAverage, setLibraryAverage] = useState(0);
  const [unrankedTracks, setUnrankedTracks] = useState<AlbumTrackRow[]>([]);
  const [rankingTrackId, setRankingTrackId] = useState<string | null>(null);

  const selectedAlbum = useMemo(
    () => allAlbums.find((album) => album.key === albumKey) ?? null,
    [allAlbums, albumKey],
  );
  const detail = useMemo(
    () => (selectedAlbum ? buildAlbumDetail(selectedAlbum, allAlbums, libraryAverage) : null),
    [selectedAlbum, allAlbums, libraryAverage],
  );
  const histogram = useMemo(
    () =>
      detail
        ? buildScoreHistogram(detail.summary.rankedSongs.map((song) => ({ score: song.score })))
        : [],
    [detail],
  );

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ratings = await fetchRankedRatings(user.id);
      setLibraryAverage(
        ratings.length === 0
          ? 0
          : Number((ratings.reduce((sum, rating) => sum + Number(rating.score), 0) / ratings.length).toFixed(1)),
      );
      const albums = buildAlbumSummaries(ratings, 'highest_rated', 'all');
      setAllAlbums(albums);

      const selected = albums.find((album) => album.key === albumKey);
      if (!selected?.albumId) {
        setUnrankedTracks([]);
        return;
      }

      const token = await getSpotifyAccessToken();
      if (!token) {
        setUnrankedTracks([]);
        return;
      }

      const albumTracks = await getAlbumTracks(token, selected.albumId);
      const rankedTrackIds = new Set(selected.rankedSongs.map((song) => song.trackId));
      const unranked = albumTracks
        .filter((track) => !rankedTrackIds.has(track.id))
        .map((track) => ({
          id: track.id,
          title: track.name,
          trackNumber: track.track_number,
          durationMs: track.duration_ms,
        }));
      setUnrankedTracks(unranked);
    } catch (error) {
      console.error(error);
      setAllAlbums([]);
      setUnrankedTracks([]);
    } finally {
      setLoading(false);
    }
  }, [user, albumKey, getSpotifyAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRankTrack = useCallback(
    async (trackId: string) => {
      if (!user) return;
      setRankingTrackId(trackId);
      try {
        const token = await getSpotifyAccessToken();
        if (!token) {
          Alert.alert('Spotify required', 'Reconnect Spotify to rank songs from this album.');
          return;
        }

        const spotifyTrack = await getTrackById(token, trackId);
        const track = spotifyTrackToTrack(spotifyTrack);
        await upsertTrack(track);

        const exists = await hasExistingRating(user.id, trackId);
        if (exists) {
          const ratings = await fetchRankedRatings(user.id);
          const existing = ratings.find((rating) => rating.track.spotify_id === trackId);
          if (existing) {
            router.push(`/song/${existing.id}`);
            return;
          }
        }

        router.push(`/compare/${trackId}`);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start ranking');
      } finally {
        setRankingTrackId(null);
      }
    },
    [user, getSpotifyAccessToken, router],
  );

  if (loading) {
    return (
      <DetailShell title="Album">
        <LoadingState />
      </DetailShell>
    );
  }

  if (!detail) {
    return (
      <DetailShell title="Album">
        <Screen contentStyle={styles.empty} omitSafeArea>
          <EmptyState
            title="No ranked songs from this album"
            subtitle="Rank songs from this release to unlock album-level insights."
            ctaTitle="Back"
            onPressCta={() => router.back()}
            mark="M"
          />
        </Screen>
      </DetailShell>
    );
  }

  const { summary } = detail;
  const rankedFraction = summary.totalTrackCount
    ? `${summary.rankedCount} of ${summary.totalTrackCount} songs ranked`
    : `${summary.rankedCount} songs ranked`;

  return (
    <DetailShell title={summary.title}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={styles.content}>
        <View style={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
          <Card style={{ gap: spacing.md, padding: spacing.lg }}>
            <View style={styles.heroRow}>
              <Image source={{ uri: summary.artworkUrl ?? undefined }} style={[styles.art, { borderRadius: radius.lg }]} contentFit="cover" />
              <View style={styles.heroCopy}>
                <Text variant="title">{summary.title}</Text>
                <Text variant="bodySmall" tone="secondary">
                  {summary.artist}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {summary.albumTypeBadge}
                  {summary.releaseYear ? ` · ${summary.releaseYear}` : ''}
                </Text>
                <Text variant="bodySmall" tone="secondary">
                  {summary.averageScore.toFixed(1)} average
                </Text>
                <Text variant="caption" tone="secondary">
                  {rankedFraction}
                  {summary.completionPct != null ? ` · ${summary.completionPct}% complete` : ''}
                </Text>
                <Text variant="caption" tone="tertiary">
                  Best: {summary.bestSong.title}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.message,
                {
                  backgroundColor: detail.isComplete ? colors.accentSoft : colors.surfaceMuted,
                  borderRadius: radius.md,
                },
              ]}>
              <Text variant="caption" tone={detail.isComplete ? 'accent' : 'secondary'}>
                {detail.completionMessage}
              </Text>
            </View>
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Album insights</Text>
            {detail.insights.map((insight) => (
              <Text key={insight} variant="bodySmall" tone="secondary">
                {insight}
              </Text>
            ))}
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Rating distribution</Text>
            {summary.rankedSongs.length < 3 ? (
              <Text variant="bodySmall" tone="secondary">
                Rank more songs to unlock a fuller distribution.
              </Text>
            ) : (
              <View style={[styles.histogram, { gap: 6 }]}>
                {histogram.map((bucket) => (
                  <View key={bucket.rating} style={styles.histRow}>
                    <Text variant="caption" tone="tertiary" style={styles.histLabel}>
                      {bucket.rating}
                    </Text>
                    <View style={[styles.histTrack, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
                      <View
                        style={[
                          styles.histFill,
                          {
                            width: `${Math.max(4, bucket.pct)}%`,
                            backgroundColor: getScoreBarColor(bucket.rating, colorScheme),
                            borderRadius: radius.pill,
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" tone="secondary" style={styles.histCount}>
                      {bucket.count}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Ranked songs</Text>
            {summary.rankedSongs
              .slice()
              .sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999) || a.rankPosition - b.rankPosition)
              .map((song) => (
                <Pressable
                  key={song.ratingId}
                  onPress={() => router.push(`/song/${song.ratingId}`)}
                  style={({ pressed, hovered }) => [
                    styles.songRow,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      borderColor: colors.border,
                      opacity: pressed ? 0.9 : 1,
                      ...(Platform.OS === 'web' && hovered
                        ? { borderColor: colors.accentMuted, boxShadow: `0 4px 14px ${colors.shadow}` }
                        : null),
                      transitionDuration: `${motion.fast}ms`,
                    },
                  ]}>
                  <Text variant="caption" tone="tertiary" style={styles.trackNo}>
                    {song.trackNumber ?? '—'}
                  </Text>
                  <View style={styles.songCopy}>
                    <Text variant="label" numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text variant="caption" tone="tertiary">
                      #{song.rankPosition} overall · Ranked {new Date(song.rankedAt).toLocaleDateString()}
                      {song.hasNotes ? ' · Notes' : ''}
                    </Text>
                  </View>
                  <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
                    <Text variant="label" tone="score">
                      {song.score.toFixed(1)}
                    </Text>
                  </View>
                </Pressable>
              ))}
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Unranked songs</Text>
            {unrankedTracks.length === 0 ? (
              <Text variant="bodySmall" tone="secondary">
                {detail.isComplete
                  ? 'Album complete.'
                  : 'Rank more songs to unlock a fuller view of this album.'}
              </Text>
            ) : (
              unrankedTracks.map((song) => (
                <View
                  key={song.id}
                  style={[
                    styles.songRow,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: radius.md,
                      borderColor: colors.border,
                    },
                  ]}>
                  <Text variant="caption" tone="tertiary" style={styles.trackNo}>
                    {song.trackNumber}
                  </Text>
                  <View style={styles.songCopy}>
                    <Text variant="label" numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text variant="caption" tone="tertiary">
                      {formatDuration(song.durationMs)}
                    </Text>
                  </View>
                  <Button
                    title={rankingTrackId === song.id ? 'Starting…' : 'Rank'}
                    size="sm"
                    onPress={() => void handleRankTrack(song.id)}
                  />
                </View>
              ))
            )}
          </Card>
        </View>
      </Screen>
    </DetailShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  art: {
    width: 116,
    height: 116,
    backgroundColor: '#1a1a1a',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  message: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  trackNo: {
    width: 22,
    textAlign: 'center',
  },
  songCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  scorePill: {
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  histogram: {},
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  histLabel: {
    width: 16,
  },
  histTrack: {
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  histFill: {
    height: '100%',
  },
  histCount: {
    width: 14,
    textAlign: 'right',
  },
});
