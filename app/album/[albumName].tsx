import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { DetailShell } from '@/components/navigation/DetailShell';
import { Button, Card, EmptyState, LoadingState, Screen, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildAlbumSummaries,
  getExploringProgressCopy,
  resolveAlbumSummary,
  type AlbumRankedSong,
  type AlbumSummary,
} from '@/lib/albums';
import { hasExistingRating, fetchRankedRatings } from '@/lib/ranking';
import { goBackOrFallback, openCompareFlow } from '@/lib/navigation';
import {
  getAlbumTracks,
  getSpotifyReadToken,
  getTrackById,
  resolveSpotifyAlbumId,
  spotifyTrackToTrack,
  upsertTrack,
} from '@/lib/spotify';

import { AlbumProgressBar } from '@/components/album';

type AlbumTrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  durationMs: number;
  artistNames: string;
};

type AlbumTracklistRow = {
  id: string;
  trackNumber: number | null;
  title: string;
  artistNames: string;
  durationMs: number | null;
  ranked: AlbumRankedSong | null;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isSpotifyRateLimitError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes('rate limiting');
}

function normalizeTrackKey(title: string, artist: string): string {
  return `${title.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()}|${artist
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()}`;
}

function buildCompletionMessage(
  isComplete: boolean,
  songsLeft: number | null,
  albumTypeBadge: 'Album' | 'EP',
  tracklistError: string | null,
  loadingTracklist: boolean,
): string {
  if (loadingTracklist) return 'Loading album tracklist…';
  if (tracklistError) return tracklistError;
  if (isComplete || songsLeft === 0) return "You've ranked every song on this release.";
  if (songsLeft == null) return 'Connect Spotify to see how close you are to finishing this release.';

  const releaseLabel = albumTypeBadge === 'EP' ? 'EP' : 'album';
  if (songsLeft === 1) return `You're almost there — 1 track left to finish this ${releaseLabel}.`;
  if (songsLeft === 2) return `You're halfway there — 2 tracks left.`;
  return `${songsLeft} tracks left to finish this ${releaseLabel}.`;
}

function findRankedSong(
  track: AlbumTrackRow,
  rankedById: Map<string, AlbumRankedSong>,
  rankedByKey: Map<string, AlbumRankedSong>,
  fallbackArtist: string,
): AlbumRankedSong | null {
  return (
    rankedById.get(track.id) ??
    rankedByKey.get(normalizeTrackKey(track.title, track.artistNames)) ??
    rankedByKey.get(normalizeTrackKey(track.title, fallbackArtist)) ??
    null
  );
}

export default function AlbumDetailScreen() {
  const { albumName } = useLocalSearchParams<{ albumName: string }>();
  const albumKey = decodeURIComponent(albumName ?? '');
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion, elevation } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpointWide;
  const { user, getSpotifyAccessToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AlbumSummary | null>(null);
  const [albumTracks, setAlbumTracks] = useState<AlbumTrackRow[]>([]);
  const [spotifyAlbumId, setSpotifyAlbumId] = useState<string | null>(null);
  const [tracklistError, setTracklistError] = useState<string | null>(null);
  const [loadingTracklist, setLoadingTracklist] = useState(false);
  const [rankingTrackId, setRankingTrackId] = useState<string | null>(null);

  const tracklistAvailable = albumTracks.length > 0;
  const rankedSongByTrackId = useMemo(() => {
    if (!summary) return new Map<string, AlbumRankedSong>();
    return new Map(summary.rankedSongs.map((song) => [song.trackId, song]));
  }, [summary]);
  const rankedSongByFallbackKey = useMemo(() => {
    if (!summary) return new Map<string, AlbumRankedSong>();
    const map = new Map<string, AlbumRankedSong>();
    for (const song of summary.rankedSongs) {
      map.set(normalizeTrackKey(song.title, summary.artist), song);
    }
    return map;
  }, [summary]);

  const unifiedTracklist = useMemo((): AlbumTracklistRow[] => {
    if (!summary) return [];

    if (tracklistAvailable) {
      return albumTracks.map((track) => ({
        id: track.id,
        trackNumber: track.trackNumber,
        title: track.title,
        artistNames: track.artistNames,
        durationMs: track.durationMs,
        ranked: findRankedSong(track, rankedSongByTrackId, rankedSongByFallbackKey, summary.artist),
      }));
    }

    return summary.rankedSongs
      .slice()
      .sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999) || a.rankPosition - b.rankPosition)
      .map((song) => ({
        id: song.trackId,
        trackNumber: song.trackNumber,
        title: song.title,
        artistNames: summary.artist,
        durationMs: null,
        ranked: song,
      }));
  }, [summary, tracklistAvailable, albumTracks, rankedSongByTrackId, rankedSongByFallbackKey]);

  const unrankedTracks = useMemo(
    () => unifiedTracklist.filter((row) => !row.ranked),
    [unifiedTracklist],
  );
  const rankedCount = unifiedTracklist.filter((row) => row.ranked).length;
  const totalTrackCount = tracklistAvailable ? albumTracks.length : summary?.totalTrackCount ?? null;
  const completionPct =
    totalTrackCount && totalTrackCount > 0 ? Math.round((rankedCount / totalTrackCount) * 100) : null;
  const songsLeft =
    totalTrackCount && totalTrackCount > 0 ? Math.max(totalTrackCount - rankedCount, 0) : null;
  const isComplete = Boolean(totalTrackCount && rankedCount === totalTrackCount);
  const totalDurationMs = tracklistAvailable
    ? albumTracks.reduce((sum, track) => sum + track.durationMs, 0)
    : null;
  const nextUnrankedTrackId = unrankedTracks[0]?.id ?? null;
  const completionMessage = useMemo(() => {
    if (loadingTracklist) return 'Loading album tracklist…';
    if (tracklistError) return tracklistError;
    if (!summary) return 'Load full tracklist to calculate completion.';
    if (isComplete) return summary.completionStatus || "You've ranked every song on this release.";
    if (songsLeft != null && songsLeft > 0) {
      return buildCompletionMessage(isComplete, songsLeft, summary.albumTypeBadge, null, false);
    }
    return getExploringProgressCopy({ songsLeft, completionPct, isComplete });
  }, [summary, isComplete, songsLeft, completionPct, tracklistError, loadingTracklist]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ratings = await fetchRankedRatings(user.id);
      const albums = buildAlbumSummaries(ratings, 'favorite', 'all');
      const selected = resolveAlbumSummary(albums, albumKey);
      setSummary(selected);

      if (!selected) {
        setAlbumTracks([]);
        setSpotifyAlbumId(null);
        setTracklistError(null);
        return;
      }

      setLoadingTracklist(true);
      setTracklistError(null);

      const token = await getSpotifyReadToken(getSpotifyAccessToken);
      const resolvedAlbumId = await resolveSpotifyAlbumId(
        token,
        selected.albumId,
        selected.rankedSongs.map((song) => song.trackId),
        selected.title,
        selected.artist,
      );

      if (!resolvedAlbumId) {
        setAlbumTracks([]);
        setSpotifyAlbumId(null);
        setTracklistError('Could not find this album on Spotify.');
        return;
      }

      setSpotifyAlbumId(resolvedAlbumId);

      const spotifyAlbumTracks = await getAlbumTracks(token, resolvedAlbumId);
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
      if (isSpotifyRateLimitError(error)) {
        console.warn(error);
      } else {
        console.error(error);
      }
      setAlbumTracks([]);
      setTracklistError(
        error instanceof Error ? error.message : 'Failed to load album tracklist from Spotify.',
      );
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

        openCompareFlow(router, trackId, { albumKey });
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start ranking');
      } finally {
        setRankingTrackId(null);
      }
    },
    [user, getSpotifyAccessToken, router, albumKey],
  );

  const handleRankNext = useCallback(() => {
    if (nextUnrankedTrackId) void handleRankTrack(nextUnrankedTrackId);
  }, [nextUnrankedTrackId, handleRankTrack]);

  const handleShuffleUnranked = useCallback(() => {
    if (unrankedTracks.length === 0) return;
    const pick = unrankedTracks[Math.floor(Math.random() * unrankedTracks.length)];
    void handleRankTrack(pick.id);
  }, [unrankedTracks, handleRankTrack]);

  const handleOpenSpotify = useCallback(() => {
    if (!spotifyAlbumId) return;
    void Linking.openURL(`https://open.spotify.com/album/${spotifyAlbumId}`);
  }, [spotifyAlbumId]);

  if (loading) {
    return (
      <DetailShell title="Album">
        <LoadingState />
      </DetailShell>
    );
  }

  if (!summary) {
    return (
      <DetailShell title="Album">
        <Screen contentStyle={styles.empty} omitSafeArea>
          <EmptyState
            title="No ranked songs from this album"
            subtitle="Rank songs from this release to start building your collection."
            ctaTitle="Back"
            onPressCta={() => goBackOrFallback(router, '/(tabs)/albums')}
            mark="M"
          />
        </Screen>
      </DetailShell>
    );
  }

  const rankedFraction = totalTrackCount
    ? `${rankedCount} / ${totalTrackCount} songs ranked`
    : `${rankedCount} songs ranked`;
  const releaseMeta = [summary.albumTypeBadge, summary.releaseYear].filter(Boolean).join(' · ');

  return (
    <DetailShell title={summary.title}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={styles.content}>
        <View style={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
          <Card elevated style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={[styles.hero, isWide && styles.heroWide]}>
              <View style={[isWide ? styles.heroArtWide : styles.heroArtCompact, elevation.card, { borderRadius: radius.lg, overflow: 'hidden' }]}>
                <Image
                  source={{ uri: summary.artworkUrl ?? undefined }}
                  style={styles.heroArtImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.heroBody}>
                <View style={{ gap: spacing.xs }}>
                  <Text variant="display" numberOfLines={2}>
                    {summary.title}
                  </Text>
                  <Text variant="body" tone="secondary">
                    {summary.artist}
                  </Text>
                  {releaseMeta ? (
                    <Text variant="caption" tone="tertiary">
                      {releaseMeta}
                    </Text>
                  ) : null}
                </View>

                <View style={[styles.heroStats, { gap: spacing.lg }]}>
                  <View style={styles.statBlock}>
                    <Text variant="overline" tone="tertiary">
                      Average
                    </Text>
                    <Text style={[styles.metric, { color: colors.text }]}>{summary.averageScore.toFixed(1)}</Text>
                    <Text variant="caption" tone="tertiary">
                      {summary.confidenceLabel}
                    </Text>
                  </View>
                  <View style={[styles.statBlock, { flex: 1 }]}>
                    <Text variant="overline" tone="tertiary">
                      Best Track
                    </Text>
                    <Text variant="label" numberOfLines={1}>
                      {summary.bestSong.title}
                    </Text>
                    <Text variant="label" tone="score">
                      {summary.bestSong.score.toFixed(1)}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 2 }}>
                  <Text variant="bodySmall" tone="secondary">
                    {rankedFraction}
                  </Text>
                  {totalDurationMs ? (
                    <Text variant="caption" tone="tertiary">
                      {formatDuration(totalDurationMs)} total
                    </Text>
                  ) : null}
                </View>

                {completionPct != null ? (
                  <View style={{ gap: spacing.xs }}>
                    <AlbumProgressBar
                      completionPct={completionPct}
                      isComplete={isComplete}
                      showLabel
                      height={8}
                    />
                  </View>
                ) : null}

                <Text
                  variant="bodySmall"
                  tone={tracklistError ? 'tertiary' : isComplete ? 'accent' : 'secondary'}>
                  {completionMessage}
                </Text>

                <View style={{ gap: spacing.sm }}>
                  {!isComplete && nextUnrankedTrackId ? (
                    <Button
                      title={rankingTrackId === nextUnrankedTrackId ? 'Starting…' : 'Rank Next Song'}
                      loading={rankingTrackId === nextUnrankedTrackId}
                      onPress={handleRankNext}
                    />
                  ) : isComplete ? (
                    <View
                      style={[
                        styles.completeBadge,
                        { backgroundColor: colors.accentSoft, borderRadius: radius.md },
                      ]}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor={colors.accent}
                        size={16}
                      />
                      <Text variant="label" tone="accent">
                        Album complete
                      </Text>
                    </View>
                  ) : null}

                  <View style={[styles.secondaryActions, { gap: spacing.sm }]}>
                    {!isComplete && unrankedTracks.length > 1 ? (
                      <Button
                        title="Shuffle Unranked"
                        variant="secondary"
                        size="sm"
                        onPress={handleShuffleUnranked}
                        disabled={Boolean(rankingTrackId)}
                      />
                    ) : null}
                    {spotifyAlbumId ? (
                      <Button
                        title="Open in Spotify"
                        variant="ghost"
                        size="sm"
                        onPress={handleOpenSpotify}
                      />
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          </Card>

          <Card style={{ gap: spacing.md, padding: spacing.md }}>
            <View style={styles.sectionHead}>
              <Text variant="heading">Tracklist</Text>
              <Text variant="caption" tone="tertiary">
                {tracklistAvailable
                  ? `${rankedCount} ranked · ${unrankedTracks.length} left`
                  : `${rankedCount} ranked`}
              </Text>
            </View>

            {loadingTracklist ? (
              <View style={[styles.trackLoading, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
                <ActivityIndicator color={colors.accent} />
                <Text variant="caption" tone="tertiary">
                  Loading tracklist…
                </Text>
              </View>
            ) : unifiedTracklist.length === 0 ? (
              <View style={[styles.trackLoading, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
                <Text variant="bodySmall" tone="secondary">
                  {tracklistError ?? 'No tracks to show yet.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {unifiedTracklist.map((row) =>
                  row.ranked ? (
                    <Pressable
                      key={row.id}
                      onPress={() => router.push(`/song/${row.ranked!.ratingId}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${row.title} details`}
                      style={({ pressed, hovered }) => [
                        styles.trackRow,
                        {
                          backgroundColor: colors.surface,
                          borderRadius: radius.lg,
                          borderColor: colors.border,
                          opacity: pressed ? 0.9 : 1,
                          ...(Platform.OS === 'web' && hovered
                            ? {
                                borderColor: colors.accentMuted,
                                transform: [{ translateY: -1 }],
                                boxShadow: `0 6px 18px ${colors.shadow}`,
                              }
                            : null),
                          transitionDuration: `${motion.normal}ms`,
                        },
                      ]}>
                      <Text variant="caption" tone="tertiary" style={styles.trackNo}>
                        {row.trackNumber ?? '—'}
                      </Text>
                      <Image
                        source={{ uri: summary.artworkUrl ?? undefined }}
                        style={[styles.rowArt, { borderRadius: radius.md }]}
                        contentFit="cover"
                      />
                      <View style={styles.trackCopy}>
                        <View style={styles.titleRow}>
                          <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                            {row.title}
                          </Text>
                          {row.ranked.hasNotes ? (
                            <SymbolView
                              name={{ ios: 'note.text', android: 'description', web: 'description' }}
                              tintColor={colors.textTertiary}
                              size={13}
                            />
                          ) : null}
                        </View>
                        <Text variant="caption" tone="secondary" numberOfLines={1}>
                          {row.artistNames}
                        </Text>
                        <Text variant="caption" tone="tertiary">
                          {row.trackNumber != null ? `Track ${row.trackNumber}` : 'Ranked track'}
                          {row.durationMs ? ` · ${formatDuration(row.durationMs)}` : ''}
                          {' · '}
                          #{row.ranked.rankPosition} overall · Ranked{' '}
                          {new Date(row.ranked.rankedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
                        <Text variant="label" tone="score">
                          {row.ranked.score.toFixed(1)}
                        </Text>
                      </View>
                    </Pressable>
                  ) : (
                    <View
                      key={row.id}
                      style={[
                        styles.trackRow,
                        {
                          backgroundColor: colors.surface,
                          borderRadius: radius.lg,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Text variant="caption" tone="tertiary" style={styles.trackNo}>
                        {row.trackNumber ?? '—'}
                      </Text>
                      <Image
                        source={{ uri: summary.artworkUrl ?? undefined }}
                        style={[styles.rowArt, { borderRadius: radius.md }]}
                        contentFit="cover"
                      />
                      <View style={styles.trackCopy}>
                        <Text variant="label" numberOfLines={1}>
                          {row.title}
                        </Text>
                        <Text variant="caption" tone="secondary" numberOfLines={1}>
                          {row.artistNames}
                        </Text>
                        <Text variant="caption" tone="tertiary">
                          {row.trackNumber != null ? `Track ${row.trackNumber}` : 'Unranked'}
                          {row.durationMs ? ` · ${formatDuration(row.durationMs)}` : ''}
                        </Text>
                      </View>
                      <Button
                        title={rankingTrackId === row.id ? 'Starting…' : 'Rank'}
                        size="sm"
                        loading={rankingTrackId === row.id}
                        onPress={() => void handleRankTrack(row.id)}
                      />
                    </View>
                  ),
                )}
              </View>
            )}

            {!loadingTracklist && tracklistError && unifiedTracklist.length > 0 ? (
              <Text variant="caption" tone="tertiary">
                Showing ranked songs only — full tracklist unavailable.
              </Text>
            ) : null}
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
  hero: {
    gap: 20,
  },
  heroWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroArtCompact: {
    width: 220,
    height: 220,
    alignSelf: 'center',
  },
  heroArtWide: {
    width: 240,
    height: 240,
    alignSelf: 'flex-start',
  },
  heroArtImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  heroBody: {
    flex: 1,
    gap: 14,
    minWidth: 0,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statBlock: {
    gap: 2,
    minWidth: 0,
  },
  metric: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    padding: 12,
  },
  trackNo: {
    width: 22,
    textAlign: 'center',
  },
  rowArt: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
  },
  trackCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
});
