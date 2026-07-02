import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DetailShell } from '@/components/navigation/DetailShell';
import { Button, Card, EmptyState, LoadingState, Screen, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildAlbumDetail,
  buildAlbumSummaries,
  type AlbumRankedSong,
  type AlbumSummary,
} from '@/lib/albums';
import { hasExistingRating, fetchRankedRatings } from '@/lib/ranking';
import { buildScoreHistogram, getScoreBarColor } from '@/lib/scoreHistogram';
import {
  getAlbumTracks,
  getSpotifyReadToken,
  getTrackById,
  resolveSpotifyAlbumId,
  spotifyTrackToTrack,
  upsertTrack,
} from '@/lib/spotify';

type AlbumTrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  durationMs: number;
  artistNames: string;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizeTrackKey(title: string, artist: string): string {
  return `${title.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()}|${artist
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()}`;
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
  const [albumTracks, setAlbumTracks] = useState<AlbumTrackRow[]>([]);
  const [tracklistError, setTracklistError] = useState<string | null>(null);
  const [loadingTracklist, setLoadingTracklist] = useState(false);
  const [rankingTrackId, setRankingTrackId] = useState<string | null>(null);

  const selectedAlbum = useMemo(
    () => allAlbums.find((album) => album.key === albumKey) ?? null,
    [allAlbums, albumKey],
  );
  const detail = useMemo(
    () => (selectedAlbum ? buildAlbumDetail(selectedAlbum, allAlbums, libraryAverage) : null),
    [selectedAlbum, allAlbums, libraryAverage],
  );
  const tracklistAvailable = albumTracks.length > 0;
  const rankedSongByTrackId = useMemo(() => {
    if (!detail) return new Map<string, AlbumRankedSong>();
    return new Map(detail.summary.rankedSongs.map((song) => [song.trackId, song]));
  }, [detail]);
  const rankedSongByFallbackKey = useMemo(() => {
    if (!detail) return new Map<string, AlbumRankedSong>();
    const map = new Map<string, AlbumRankedSong>();
    for (const song of detail.summary.rankedSongs) {
      map.set(normalizeTrackKey(song.title, detail.summary.artist), song);
    }
    return map;
  }, [detail]);
  const rankedFromTracklist = useMemo(() => {
    if (!detail || !tracklistAvailable) return [];
    return albumTracks
      .map((track) => {
        return (
          rankedSongByTrackId.get(track.id) ??
          rankedSongByFallbackKey.get(normalizeTrackKey(track.title, track.artistNames))
        );
      })
      .filter((song): song is NonNullable<typeof song> => Boolean(song));
  }, [detail, tracklistAvailable, albumTracks, rankedSongByTrackId, rankedSongByFallbackKey]);
  const unrankedTracks = useMemo(() => {
    if (!tracklistAvailable) return [];
    const rankedIds = new Set(rankedFromTracklist.map((song) => song.trackId));
    const rankedFallback = new Set(
      rankedFromTracklist.map((song) => normalizeTrackKey(song.title, detail?.summary.artist ?? '')),
    );
    return albumTracks.filter(
      (track) =>
        !rankedIds.has(track.id) &&
        !rankedFallback.has(normalizeTrackKey(track.title, track.artistNames)),
    );
  }, [tracklistAvailable, rankedFromTracklist, albumTracks, detail]);
  const totalTrackCount = tracklistAvailable ? albumTracks.length : detail?.summary.totalTrackCount ?? null;
  const rankedCount = tracklistAvailable ? rankedFromTracklist.length : detail?.summary.rankedCount ?? 0;
  const completionPct =
    totalTrackCount && totalTrackCount > 0 ? Math.round((rankedCount / totalTrackCount) * 100) : null;
  const songsLeft = totalTrackCount && totalTrackCount > 0 ? Math.max(totalTrackCount - rankedCount, 0) : null;
  const isComplete = Boolean(totalTrackCount && rankedCount === totalTrackCount);
  const totalDurationMs = tracklistAvailable
    ? albumTracks.reduce((sum, track) => sum + track.durationMs, 0)
    : null;
  const completionMessage = isComplete
    ? "✓ Album Complete\nYou've ranked every song on this release."
    : songsLeft != null
      ? songsLeft === 1
        ? '1 song left to complete this album.'
        : `Rank ${songsLeft} more songs to complete this album.`
      : tracklistError
        ? tracklistError
        : loadingTracklist
          ? 'Loading album tracklist…'
          : 'Load full tracklist to calculate completion.';
  const rankedListRows = useMemo(() => {
    if (!detail) return [];
    if (tracklistAvailable) {
      return rankedFromTracklist.slice().sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999));
    }
    return detail.summary.rankedSongs
      .slice()
      .sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999) || a.rankPosition - b.rankPosition);
  }, [detail, tracklistAvailable, rankedFromTracklist]);
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
      if (!selected) {
        setAlbumTracks([]);
        setTracklistError(null);
        return;
      }

      setLoadingTracklist(true);
      setTracklistError(null);

      const token = await getSpotifyReadToken(getSpotifyAccessToken);

      const spotifyAlbumId = await resolveSpotifyAlbumId(
        token,
        selected.albumId,
        selected.rankedSongs.map((song) => song.trackId),
        selected.title,
        selected.artist,
      );

      if (!spotifyAlbumId) {
        setAlbumTracks([]);
        setTracklistError('Could not find this album on Spotify.');
        return;
      }

      for (const song of selected.rankedSongs) {
        try {
          const spotifyTrack = await getTrackById(token, song.trackId);
          await upsertTrack(spotifyTrackToTrack(spotifyTrack));
        } catch {
          // Best effort metadata backfill.
        }
      }

      const spotifyAlbumTracks = await getAlbumTracks(token, spotifyAlbumId);
      setAlbumTracks(
        spotifyAlbumTracks.map((track) => ({
          id: track.id,
          title: track.name,
          trackNumber: track.track_number,
          durationMs: track.duration_ms,
          artistNames: track.artists?.map((artist) => artist.name).join(', ') ?? selected.artist,
        })),
      );
    } catch (error) {
      console.error(error);
      setAllAlbums([]);
      setAlbumTracks([]);
      setTracklistError(error instanceof Error ? error.message : 'Failed to load album tracklist.');
    } finally {
      setLoadingTracklist(false);
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
  const rankedFraction = totalTrackCount ? `${rankedCount} / ${totalTrackCount} songs ranked` : `${rankedCount} songs ranked`;
  const heroInsightRows = [
    { icon: 'sparkles', label: `Your #${detail.rankAmongAlbums} album by average score` },
    ...(libraryAverage > 0
      ? [
          {
            icon: 'chart.line.uptrend.xyaxis',
            label:
              summary.averageScore >= libraryAverage
                ? `${(summary.averageScore - libraryAverage).toFixed(1)} points above your library average`
                : `${Math.abs(summary.averageScore - libraryAverage).toFixed(1)} points below your library average`,
          },
        ]
      : []),
    { icon: 'music.note', label: `${summary.bestSong.title} is your highest-rated track` },
    { icon: 'checkmark.circle', label: totalTrackCount != null ? `${rankedCount} of ${totalTrackCount} songs ranked` : `${rankedCount} songs ranked` },
  ];

  return (
    <DetailShell title={summary.title}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={styles.content}>
        <View style={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
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
                  {completionPct != null ? ` · ${completionPct}% complete` : ''}
                </Text>
                <Text variant="caption" tone="tertiary">
                  Best track: {summary.bestSong.title} · {summary.bestSong.score.toFixed(1)}
                </Text>
                {totalDurationMs ? (
                  <Text variant="caption" tone="tertiary">
                    {formatDuration(totalDurationMs)} total
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completionPct ?? 0}%`,
                    backgroundColor: isComplete ? colors.accent : colors.accentMuted,
                    borderRadius: radius.pill,
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.message,
                {
                  backgroundColor: isComplete ? colors.accentSoft : colors.surfaceMuted,
                  borderRadius: radius.md,
                },
              ]}>
              <Text variant="caption" tone={isComplete ? 'accent' : 'secondary'}>
                {completionMessage}
              </Text>
            </View>
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <View style={styles.sectionHead}>
              <Text variant="heading">Ranked songs</Text>
              <Text variant="caption" tone="tertiary">
                {rankedCount} ranked
              </Text>
            </View>
            {rankedListRows.map((song) => (
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
                <Image
                  source={{ uri: summary.artworkUrl ?? undefined }}
                  style={[styles.rowArt, { borderRadius: radius.sm }]}
                  contentFit="cover"
                />
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
            <View style={styles.sectionHead}>
              <Text variant="heading">Unranked songs</Text>
              <Text variant="caption" tone="tertiary">
                {songsLeft ?? unrankedTracks.length} left
              </Text>
            </View>
            {loadingTracklist ? (
              <View style={[styles.trackLoading, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
                <ActivityIndicator color={colors.accent} />
                <Text variant="caption" tone="tertiary">
                  Loading album tracklist…
                </Text>
              </View>
            ) : tracklistError ? (
              <View style={[styles.trackLoading, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
                <Text variant="bodySmall" tone="secondary">
                  {tracklistError}
                </Text>
              </View>
            ) : unrankedTracks.length === 0 ? (
              <View style={[styles.trackLoading, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
                <Text variant="bodySmall" tone={isComplete ? 'accent' : 'secondary'}>
                  {isComplete
                    ? '✓ Every song on this album has been ranked.'
                    : 'No unranked tracks found for this album.'}
                </Text>
              </View>
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
                      {song.artistNames} · {formatDuration(song.durationMs)}
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

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Album insights</Text>
            {heroInsightRows.map((row) => (
              <View key={row.label} style={styles.insightRow}>
                <SymbolView
                  name={{ ios: row.icon as never, android: 'insights', web: 'insights' }}
                  tintColor={colors.accent}
                  size={14}
                />
                <Text variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
                  {row.label}
                </Text>
              </View>
            ))}
          </Card>

          <Card style={{ gap: spacing.sm, padding: spacing.md }}>
            <Text variant="heading">Rating distribution</Text>
            {summary.rankedSongs.length < 3 ? (
              <View style={{ gap: 8 }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <View key={value} style={styles.histRow}>
                    <Text variant="caption" tone="tertiary" style={styles.histLabel}>
                      {value}
                    </Text>
                    <View style={[styles.histTrack, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
                      <View
                        style={[
                          styles.histFill,
                          {
                            width: `${12 + value * 7}%`,
                            backgroundColor: colors.surfaceHover,
                            borderRadius: radius.pill,
                          },
                        ]}
                      />
                    </View>
                    <Text variant="caption" tone="tertiary" style={styles.histCount}>
                      ·
                    </Text>
                  </View>
                ))}
                <Text variant="bodySmall" tone="secondary">
                  Rank more songs from this album to unlock a fuller distribution.
                </Text>
              </View>
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
    width: 132,
    height: 132,
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
  progressTrack: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
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
  rowArt: {
    width: 34,
    height: 34,
    backgroundColor: '#1a1a1a',
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
  trackLoading: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
