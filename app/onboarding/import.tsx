import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { Button, Card, Screen, SectionHeader, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
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
  const { colors, spacing, elevation } = getTheme(colorScheme);
  const router = useRouter();
  const { user, getSpotifyAccessToken, signOut } = useAuth();
  const { startQueue } = useImportQueue();

  const [selectedRange, setSelectedRange] = useState<TopTracksTimeRange | null>(null);
  const [tracks, setTracks] = useState<SpotifySearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchTracks = async (timeRange: TopTracksTimeRange) => {
    if (!user) return;

    setSelectedRange(timeRange);
    setLoading(true);
    setTracks([]);
    setErrorMessage(null);
    setStatusMessage('Fetching your Spotify top tracks...');

    try {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        setErrorMessage('Spotify did not return an access token. Sign out and sign in with Spotify again.');
        setStatusMessage(null);
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
        setStatusMessage(
          topTracks.length === 0
            ? 'Spotify did not return any top tracks for this range yet. Try the other range or add songs manually.'
            : 'All your top tracks from this range are already in your ranked list.',
        );
      } else {
        setStatusMessage(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not fetch tracks');
      setStatusMessage(null);
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
    <Screen contentStyle={styles.content}>
      <SectionHeader
        title="Get started fast"
        subtitle="Import your most-played Spotify tracks and rank them one by one."
      />

      <View style={styles.rangeRow}>
        {TIME_RANGE_OPTIONS.map((option) => {
          const isSelected = selectedRange === option.value;
          return (
            <Button
              key={option.value}
              onPress={() => handleFetchTracks(option.value)}
              disabled={loading}
              variant={isSelected ? 'primary' : 'secondary'}
              title={option.label}
              style={styles.rangeCard}
            />
          );
        })}
      </View>
      {selectedRange ? (
        <Text variant="caption" tone="secondary" style={styles.rangeDescription}>
          {TIME_RANGE_OPTIONS.find((item) => item.value === selectedRange)?.description}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : null}

      {statusMessage ? (
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {statusMessage}
        </Text>
      ) : null}

      {errorMessage ? (
        <Card style={[styles.messageBox, { borderColor: colors.error, boxShadow: 'none', elevation: 0 }]}>
          <Text variant="label" tone="error">Import failed</Text>
          <Text variant="bodySmall" tone="secondary">
            {errorMessage}
          </Text>
          {errorMessage.includes('access token') ? (
            <Button title="Sign in with Spotify again" variant="secondary" onPress={signOut} />
          ) : null}
        </Card>
      ) : null}

      {!loading && tracks.length > 0 ? (
        <>
          <Text variant="heading">
            {tracks.length} songs to rank
          </Text>
          <Text variant="bodySmall" tone="secondary">
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
          <Button title="Start ranking" onPress={handleStartRanking} loading={starting} />
        </>
      ) : null}

      <Button title="I&apos;ll add songs manually" variant="ghost" onPress={handleSkip} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rangeCard: {
    flex: 1,
    minHeight: 56,
  },
  rangeDescription: {
    marginTop: -8,
    marginBottom: 8,
  },
  loader: {
    marginTop: 24,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  messageBox: {
    marginTop: 12,
    gap: 6,
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
});
