import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

import { SongCard } from '@/components/SongCard';
import { Card, Screen, SectionHeader, Text, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { hasExistingRating } from '@/lib/ranking';
import { searchTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import type { SpotifySearchTrack } from '@/types';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const tracks = await searchTracks(query);
        setResults(tracks);
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error ? error.message : 'Could not search Spotify.';
        Alert.alert('Search failed', message);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleLogSong = useCallback(
    async (item: SpotifySearchTrack) => {
      if (!user) return;

      setLogging(item.id);
      try {
        const track = spotifyTrackToTrack(item);
        await upsertTrack(track);

        const exists = await hasExistingRating(user.id, track.spotify_id);
        if (exists) {
          Alert.alert('Already logged', 'This song is already in your ranked list.');
          return;
        }

        router.push(`/compare/${track.spotify_id}`);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to log song');
      } finally {
        setLogging(null);
      }
    },
    [user, router],
  );

  return (
    <Screen contentStyle={styles.container}>
      <SectionHeader
        title="Find a track"
        subtitle="Search Spotify and add a song into your ranking flow."
      />

      <Card
        style={[
          styles.searchBox,
          {
            gap: spacing.sm,
          },
        ]}>
        <Text variant="caption" tone="secondary" style={styles.searchIcon}>
          Search
        </Text>
        <TextField
          style={styles.input}
          placeholder="Song, artist, or album"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </Card>

      {searching ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : null}

      {!searching && hasQuery && results.length === 0 ? (
        <Text variant="body" tone="secondary" style={styles.empty}>
          No results found
        </Text>
      ) : null}

      {!searching && !hasQuery ? (
        <Text variant="body" tone="secondary" style={styles.empty}>
          Your next favorite song goes here.
        </Text>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SongCard
            track={spotifyTrackToTrack(item)}
            onPress={() => handleLogSong(item)}
            rightElement={
              logging === item.id ? (
                <ActivityIndicator color={colors.tint} />
              ) : (
                <Text variant="label" tone="accent">
                  Log
                </Text>
              )
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  searchBox: {
    marginTop: 4,
    marginBottom: 4,
  },
  searchIcon: {
    textTransform: 'uppercase',
  },
  input: {
    paddingVertical: 14,
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
  list: {
    paddingTop: 4,
    gap: 8,
  },
  separator: {
    height: 8,
  },
});
