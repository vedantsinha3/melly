import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { markOnboardingCompleted } from '@/lib/profile';
import { hasExistingRating } from '@/lib/ranking';
import { getUserTopTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import type { SpotifySearchTrack, TopTracksTimeRange } from '@/types';

const TIME_RANGE_OPTIONS: {
  value: TopTracksTimeRange;
  label: string;
  description: string;
}[] = [
  { value: 'short_term', label: '~1 month', description: 'Your top tracks from the past 4 weeks' },
  { value: 'medium_term', label: '~6 months', description: 'Your top tracks from the past 6 months' },
];

export default function ImportOnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, getSpotifyAccessToken } = useAuth();
  const { startQueue } = useImportQueue();

  const [selectedRange, setSelectedRange] = useState<TopTracksTimeRange | null>(null);
  const [tracks, setTracks] = useState<SpotifySearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const handleFetchTracks = async (timeRange: TopTracksTimeRange) => {
    if (!user) return;

    setSelectedRange(timeRange);
    setLoading(true);
    setTracks([]);

    try {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        Alert.alert(
          'Spotify session expired',
          'Please sign out and sign in with Spotify again to import your top tracks.',
        );
        return;
      }

      const topTracks = await getUserTopTracks(accessToken, timeRange);
      const unrated: SpotifySearchTrack[] = [];

      for (const track of topTracks) {
        const exists = await hasExistingRating(user.id, track.id);
        if (!exists) {
          unrated.push(track);
        }
      }

      setTracks(unrated);

      if (unrated.length === 0) {
        Alert.alert(
          'Nothing new to import',
          'All your top tracks are already in your ranked list.',
        );
      }
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Could not fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRanking = async () => {
    if (!user || tracks.length === 0) return;

    setStarting(true);
    try {
      for (const track of tracks) {
        await upsertTrack(spotifyTrackToTrack(track));
      }

      const trackIds = tracks.map((t) => t.id);
      startQueue(trackIds);
      router.replace(`/compare/${trackIds[0]}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start ranking');
      setStarting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      await markOnboardingCompleted(user.id);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to skip onboarding');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Get started fast</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Import your most-played Spotify tracks and rank them one by one.
        </Text>
      </View>

      <View style={styles.rangeRow}>
        {TIME_RANGE_OPTIONS.map((option) => {
          const isSelected = selectedRange === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleFetchTracks(option.value)}
              style={[
                styles.rangeCard,
                {
                  backgroundColor: isSelected ? colors.surface : colors.background,
                  borderColor: isSelected ? colors.accent : colors.border,
                },
              ]}>
              <Text style={[styles.rangeLabel, { color: colors.text }]}>{option.label}</Text>
              <Text style={[styles.rangeDescription, { color: colors.textSecondary }]}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : null}

      {!loading && tracks.length > 0 ? (
        <>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {tracks.length} songs to rank
          </Text>
          <Text style={[styles.previewHint, { color: colors.textSecondary }]}>
            About 3–5 comparisons per song
          </Text>
          <FlatList
            data={tracks}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item, index }) => (
              <View style={[styles.trackRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.trackIndex, { color: colors.textSecondary }]}>
                  {index + 1}
                </Text>
                <Image
                  source={{ uri: item.album.images[0]?.url }}
                  style={styles.artwork}
                  contentFit="cover"
                />
                <View style={styles.trackInfo}>
                  <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.artists.map((a) => a.name).join(', ')}
                  </Text>
                </View>
              </View>
            )}
          />
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleStartRanking}
            disabled={starting}>
            {starting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Start ranking</Text>
            )}
          </Pressable>
        </>
      ) : null}

      <Pressable style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          I&apos;ll add songs manually
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rangeCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  rangeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  loader: {
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  previewHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  trackIndex: {
    width: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '600',
  },
  trackArtist: {
    fontSize: 13,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
  },
});
