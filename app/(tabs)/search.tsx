import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SongCard } from '@/components/SongCard';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { hasExistingRating } from '@/lib/ranking';
import { searchTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import type { SpotifySearchTrack } from '@/types';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [logging, setLogging] = useState<string | null>(null);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        placeholder="Search for a song..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {searching ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : null}

      {!searching && query.trim().length > 0 && results.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>No results found</Text>
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
                <Text style={[styles.logText, { color: colors.accent }]}>Log</Text>
              )
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
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
    paddingTop: 8,
    gap: 8,
  },
  separator: {
    height: 8,
  },
  logText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
