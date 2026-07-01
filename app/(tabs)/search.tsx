import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInputKeyPressEventData,
  View,
} from 'react-native';

import { LibrarySearchResults } from '@/components/log-song/LibrarySearchResults';
import { LogSongProgressBanner } from '@/components/log-song/LogSongProgressBanner';
import { TrackFeedCard } from '@/components/log-song/TrackFeedCard';
import { TrackFeedSection } from '@/components/log-song/TrackFeedSection';
import { Screen, Text, TextField, wideScrollContentStyle } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  buildLibrarySearchViewModel,
  flattenSearchResults,
  type LibrarySearchViewModel,
  type SelectableSearchResult,
} from '@/lib/librarySearch';
import {
  buildLogSongFeed,
  buildRankingProgress,
  pickNextSuggestion,
  type FeedSection,
} from '@/lib/logSongFeed';
import { fetchRankedRatings, hasExistingRating } from '@/lib/ranking';
import { searchTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import { supabase } from '@/lib/supabase';
import type { RatingWithTrack, SpotifySearchTrack, Track } from '@/types';

const EMPTY_SEARCH: LibrarySearchViewModel = { ranked: [], spotify: [] };

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user, isSpotifyUser, getSpotifyAccessToken, loading: authLoading } = useAuth();
  const { isActive, getCurrentTrackId, getProgress } = useImportQueue();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [searchModel, setSearchModel] = useState<LibrarySearchViewModel>(EMPTY_SEARCH);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);
  const [rankedRatings, setRankedRatings] = useState<RatingWithTrack[]>([]);
  const [sections, setSections] = useState<FeedSection[]>([]);
  const [continueTrack, setContinueTrack] = useState<Track | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasQuery = query.trim().length > 2;
  const rankedCount = rankedRatings.length;
  const progress = useMemo(() => buildRankingProgress(rankedCount), [rankedCount]);
  const queueProgress = getProgress();
  const selectableResults = useMemo(() => flattenSearchResults(searchModel), [searchModel]);

  const loadFeed = useCallback(async () => {
    if (!user || authLoading) return;

    setFeedLoading(true);
    setFeedError(null);
    try {
      const ratings = await fetchRankedRatings(user.id);
      const ids = new Set(ratings.map((rating) => rating.track.spotify_id));
      setRankedRatings(ratings);

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
      setSearchModel(EMPTY_SEARCH);
      setSearching(false);
      setSelectedIndex(0);
      return;
    }

    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const spotifyTracks = await searchTracks(trimmed);
        setSearchModel(buildLibrarySearchViewModel(rankedRatings, spotifyTracks, trimmed));
        setSelectedIndex(0);
      } catch (error) {
        console.error(error);
        setSearchModel(buildLibrarySearchViewModel(rankedRatings, [], trimmed));
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, hasQuery, rankedRatings]);

  const openRankedSong = useCallback(
    (ratingId: string) => {
      router.push(`/song/${ratingId}`);
    },
    [router],
  );

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
          const existing = rankedRatings.find((rating) => rating.track.spotify_id === track.spotify_id);
          if (existing) {
            openRankedSong(existing.id);
            return;
          }
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
    [user, router, loadFeed, rankedRatings, openRankedSong],
  );

  const activateSelection = useCallback(
    (selection: SelectableSearchResult | undefined) => {
      if (!selection) return;

      if (selection.kind === 'ranked' || selection.kind === 'spotify-view') {
        openRankedSong(selection.ratingId);
        return;
      }

      const match = searchModel.spotify.find((item) => item.track.id === selection.spotifyId);
      if (match) {
        startRanking(match.track);
      }
    },
    [openRankedSong, searchModel.spotify, startRanking],
  );

  const handleSearchKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = event.nativeEvent.key;

    if (key === 'Escape') {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    if (!hasQuery || selectableResults.length === 0) return;

    if (key === 'ArrowDown') {
      event.preventDefault?.();
      setSelectedIndex((current) => (current + 1) % selectableResults.length);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault?.();
      setSelectedIndex((current) =>
        current <= 0 ? selectableResults.length - 1 : current - 1,
      );
      return;
    }

    if (key === 'Enter') {
      event.preventDefault?.();
      activateSelection(selectableResults[selectedIndex]);
    }
  };

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
        style={styles.scroll}
        contentContainerStyle={[wideScrollContentStyle(), styles.content, { gap: spacing.lg, paddingBottom: spacing['2xl'] }]}
        keyboardShouldPersistTaps="handled">
        <LogSongProgressBanner
          headline={progress.headline}
          subline={progress.subline}
          completionPct={progress.completionPct}
        />

        <View style={[styles.searchWrap, { gap: spacing.xs }]}>
          <Text variant="caption" tone="tertiary">
            Search your library and Spotify
          </Text>
          <TextField
            placeholder="Song, artist, or album"
            value={query}
            onChangeText={setQuery}
            onKeyPress={handleSearchKeyPress}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          {hasQuery ? (
            <Text variant="caption" tone="tertiary">
              ↑↓ to navigate · Enter to open · Esc to clear
            </Text>
          ) : null}
        </View>

        {hasQuery ? (
          <LibrarySearchResults
            model={searchModel}
            loading={searching}
            query={query}
            selectedIndex={selectedIndex}
            loggingId={logging}
            onViewRanked={openRankedSong}
            onRankSpotify={startRanking}
          />
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
  scroll: {
    flex: 1,
    width: '100%',
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
