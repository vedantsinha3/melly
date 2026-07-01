import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { LogSongProgressBanner } from '@/components/log-song/LogSongProgressBanner';
import { TrackFeedCard } from '@/components/log-song/TrackFeedCard';
import { TrackFeedSection } from '@/components/log-song/TrackFeedSection';
import { SongCard } from '@/components/SongCard';
import { Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildLogSongFeed,
  buildRankingProgress,
  pickNextSuggestion,
  type FeedSection,
} from '@/lib/logSongFeed';
import { fetchRankedRatings, hasExistingRating } from '@/lib/ranking';
import { searchTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';
import type { SpotifySearchTrack, Track } from '@/types';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user, isSpotifyUser, getSpotifyAccessToken, loading: authLoading } = useAuth();
  const { isActive, getCurrentTrackId, getProgress } = useImportQueue();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);
  const [rankedCount, setRankedCount] = useState(0);
  const [rankedIds, setRankedIds] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<FeedSection[]>([]);
  const [continueTrack, setContinueTrack] = useState<Track | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const [feedError, setFeedError] = useState<string | null>(null);

  const hasQuery = query.trim().length > 2;
  const progress = useMemo(() => buildRankingProgress(rankedCount), [rankedCount]);
  const queueProgress = getProgress();

  const loadFeed = useCallback(async () => {
    if (!user || authLoading) return;

    setFeedLoading(true);
    setFeedError(null);
    try {
      const ratings = await fetchRankedRatings(user.id);
      const ids = new Set(ratings.map((rating) => rating.track.spotify_id));
      setRankedCount(ratings.length);
      setRankedIds(ids);

      const queueTrackId = isActive ? getCurrentTrackId() : null;
      if (queueTrackId) {
        const { data } = await supabase.from('tracks').select('*').eq('spotify_id', queueTrackId).maybeSingle();
        setContinueTrack((data as Track) ?? null);
      } else {
        setContinueTrack(null);
      }

      if (isSpotifyUser) {
        const token = await getSpotifyAccessToken();
        if (token) {
          const feed = await buildLogSongFeed({ accessToken: token, rankedTrackIds: ids });
          setSections(feed);

          const next = pickNextSuggestion(feed, ids) ?? feed[0]?.tracks[0]?.track.id ?? null;
          setHighlightId(next);
          return;
        }

        setFeedError('Spotify session expired. Sign out and sign in with Spotify again to restore suggestions.');
      }

      setSections([]);
      setHighlightId(null);
    } catch (error) {
      console.error(error);
      setFeedError(error instanceof Error ? error.message : 'Failed to load suggestions');
    } finally {
      setFeedLoading(false);
    }
  }, [user, authLoading, isSpotifyUser, getSpotifyAccessToken, isActive, getCurrentTrackId]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        loadFeed();
      }
    }, [loadFeed, authLoading]),
  );

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const tracks = await searchTracks(query);
        setResults(tracks.filter((track) => !rankedIds.has(track.id)));
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, hasQuery, rankedIds]);

  const startRanking = useCallback(
    async (item: SpotifySearchTrack | Track) => {
      if (!user) return;

      const spotifyId = 'spotify_id' in item ? item.spotify_id : item.id;
      setLogging(spotifyId);

      try {
        const track = 'spotify_id' in item ? item : spotifyTrackToTrack(item);
        await upsertTrack(track);

        const exists = await hasExistingRating(user.id, track.spotify_id);
        if (exists) {
          Alert.alert('Already ranked', 'This song is already in your ranked list.');
          await loadFeed();
          return;
        }

        router.push(`/compare/${track.spotify_id}`);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start ranking');
      } finally {
        setLogging(null);
      }
    },
    [user, router, loadFeed],
  );

  const continueSection = continueTrack ? (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.sectionHeader}>
        <Text variant="heading">Continue ranking</Text>
        <Text variant="caption" tone="tertiary">
          {isActive
            ? `Song ${queueProgress.current} of ${queueProgress.total} in your queue`
            : 'Pick up where you left off'}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        <TrackFeedCard
          track={{
            id: continueTrack.spotify_id,
            name: continueTrack.name,
            artists: continueTrack.artist_names.map((name) => ({ name })),
            album: {
              name: continueTrack.album_name,
              images: continueTrack.album_art_url ? [{ url: continueTrack.album_art_url }] : [],
            },
            duration_ms: continueTrack.duration_ms,
            preview_url: continueTrack.preview_url,
          }}
          meta="Ready to rank"
          highlighted
          loading={logging === continueTrack.spotify_id}
          onPress={() => startRanking(continueTrack)}
        />
      </ScrollView>
    </View>
  ) : null;

  return (
    <Screen edgeToEdge wide contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { gap: spacing.lg, paddingBottom: spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled">
        <LogSongProgressBanner
          headline={progress.headline}
          subline={progress.subline}
          completionPct={progress.completionPct}
        />

        <View style={[styles.searchWrap, { gap: spacing.xs }]}>
          <Text variant="caption" tone="tertiary">
            Search Spotify
          </Text>
          <TextField
            placeholder="Song, artist, or album"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.searchInput}
          />
        </View>

        {hasQuery ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Search results</Text>
            {searching ? <ActivityIndicator color={colors.accent} /> : null}
            {!searching && results.length === 0 ? (
              <Text variant="bodySmall" tone="secondary">
                No unranked tracks found. Try another search.
              </Text>
            ) : null}
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item }) => (
                <SongCard
                  track={spotifyTrackToTrack(item)}
                  onPress={() => startRanking(item)}
                  rightElement={
                    logging === item.id ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <Text variant="label" tone="accent">
                        Rank
                      </Text>
                    )
                  }
                />
              )}
            />
          </View>
        ) : (
          <>
            {feedLoading ? (
              <View style={styles.loadingFeed}>
                <ActivityIndicator color={colors.accent} />
                <Text variant="caption" tone="tertiary">
                  Loading your Spotify picks…
                </Text>
              </View>
            ) : (
              <>
                {continueSection}
                {sections.map((section) => (
                  <TrackFeedSection
                    key={section.id}
                    section={section}
                    loggingId={logging}
                    highlightId={highlightId}
                    onRank={(trackId) => {
                      const item = section.tracks.find((t) => t.track.id === trackId)?.track;
                      if (item) startRanking(item);
                    }}
                  />
                ))}
                {feedError ? (
                  <View style={[styles.connectHint, { backgroundColor: colors.surfaceMuted, borderRadius: 12 }]}>
                    <Text variant="bodySmall" tone="secondary">
                      {feedError}
                    </Text>
                  </View>
                ) : null}
                {!isSpotifyUser ? (
                  <View style={[styles.connectHint, { backgroundColor: colors.surfaceMuted, borderRadius: 12 }]}>
                    <Text variant="bodySmall" tone="secondary">
                      Connect Spotify to see recently played, liked songs, and personalized picks here.
                    </Text>
                  </View>
                ) : null}
              </>
            )}
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
  content: {
    flexGrow: 1,
    paddingTop: 8,
  },
  searchWrap: {
    opacity: 0.92,
  },
  searchInput: {
    paddingVertical: 12,
  },
  sectionHeader: {
    gap: 2,
  },
  loadingFeed: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  connectHint: {
    padding: 16,
  },
});
