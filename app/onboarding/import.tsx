import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { ImportPathCard, OnboardingUnlocks } from '@/components/onboarding';
import { ArtworkPreviewStack } from '@/components/onboarding/ArtworkPreviewStack';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { Button, Card, Screen, Text } from '@/components/ui';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  estimateRankingMinutes,
  formatSongCount,
  IMPORT_PATHS,
  ONBOARDING_BENEFITS,
} from '@/lib/onboarding';
import { markOnboardingCompleted } from '@/lib/profile';
import { hasExistingRating } from '@/lib/ranking';
import { getUserTopTracks, spotifyTrackToTrack, upsertTrack } from '@/lib/spotify';
import type { SpotifySearchTrack, TopTracksTimeRange } from '@/types';

function artworkUrlsFromTracks(tracks: SpotifySearchTrack[]): string[] {
  return tracks
    .map((track) => track.album.images[0]?.url)
    .filter((url): url is string => Boolean(url));
}

export default function ImportOnboardingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= layout.breakpointWide;
  const router = useRouter();
  const { user, getSpotifyAccessToken, signOut } = useAuth();
  const { startQueue } = useImportQueue();

  const [previewArt, setPreviewArt] = useState<Record<TopTracksTimeRange, string[]>>({
    short_term: [],
    medium_term: [],
  });
  const [previewLoading, setPreviewLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TopTracksTimeRange | null>(null);
  const [tracks, setTracks] = useState<SpotifySearchTrack[]>([]);
  const [loadingRange, setLoadingRange] = useState<TopTracksTimeRange | null>(null);
  const [starting, setStarting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPreviews = useCallback(async () => {
    if (!user) return;

    setPreviewLoading(true);
    try {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        setErrorMessage('Spotify did not return an access token. Sign out and sign in with Spotify again.');
        return;
      }

      const [shortTerm, mediumTerm] = await Promise.all([
        getUserTopTracks(accessToken, 'short_term', 5),
        getUserTopTracks(accessToken, 'medium_term', 5),
      ]);

      setPreviewArt({
        short_term: artworkUrlsFromTracks(shortTerm),
        medium_term: artworkUrlsFromTracks(mediumTerm),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setPreviewLoading(false);
    }
  }, [user, getSpotifyAccessToken]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  const rankingMinutes = useMemo(
    () => (tracks.length > 0 ? estimateRankingMinutes(tracks.length) : null),
    [tracks.length],
  );

  const handleFetchTracks = async (timeRange: TopTracksTimeRange) => {
    if (!user) return;

    setSelectedRange(timeRange);
    setLoadingRange(timeRange);
    setTracks([]);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) {
        setErrorMessage('Spotify did not return an access token. Sign out and sign in with Spotify again.');
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
      setPreviewArt((current) => ({
        ...current,
        [timeRange]: artworkUrlsFromTracks(unrated.slice(0, 5)),
      }));

      if (unrated.length === 0) {
        setStatusMessage(
          topTracks.length === 0
            ? 'Spotify has no top tracks for this period yet. Try the other option or search manually.'
            : 'You have already ranked every song from this period — nice work!',
        );
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not fetch tracks');
    } finally {
      setLoadingRange(null);
    }
  };

  const handlePathAction = async (timeRange: TopTracksTimeRange) => {
    if (loadingRange) return;

    if (selectedRange === timeRange && tracks.length > 0) {
      await handleStartRanking();
      return;
    }

    await handleFetchTracks(timeRange);
  };

  const handleStartRanking = async () => {
    if (!user || tracks.length === 0) return;

    setStarting(true);
    try {
      for (const track of tracks) {
        await upsertTrack(spotifyTrackToTrack(track));
      }

      const trackIds = tracks.map((track) => track.id);
      startQueue(trackIds);
      router.replace(`/compare/${trackIds[0]}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start ranking');
      setStarting(false);
    }
  };

  const handleManualSearch = async () => {
    if (!user) return;

    try {
      await markOnboardingCompleted(user.id);
      router.replace('/(tabs)/search');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to continue');
    }
  };

  return (
    <Screen scroll edgeToEdge wide contentStyle={styles.content}>
      <View style={[styles.hero, { gap: spacing.md, marginBottom: spacing.lg }]}>
        <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
          <SymbolView
            name={{ ios: 'music.note', android: 'music_note', web: 'music_note' }}
            tintColor={colors.accent}
            size={14}
          />
          <Text variant="overline" tone="accent">
            Your journey starts here
          </Text>
        </View>

        <Text variant="display" style={styles.headline}>
          Build your Taste Profile
        </Text>
        <Text variant="body" tone="secondary" style={styles.subhead}>
          Rank the songs you already love. Melly learns your taste with every pick — no star ratings, just
          honest comparisons.
        </Text>

        <View style={[styles.benefitsRow, { gap: spacing.sm }]}>
          {ONBOARDING_BENEFITS.map((benefit) => (
            <View
              key={benefit}
              style={[
                styles.benefitPill,
                {
                  backgroundColor: colors.surface,
                  borderRadius: radius.pill,
                  borderColor: colors.border,
                },
              ]}>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                tintColor={colors.accent}
                size={12}
              />
              <Text variant="caption" style={styles.benefitText}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { gap: spacing.sm, marginBottom: spacing.lg }]}>
        <Text variant="heading">Start with the songs you love</Text>
        <Text variant="bodySmall" tone="secondary">
          Pick a listening window. We will pull your Spotify favorites and guide you through quick head-to-head
          rankings.
        </Text>
      </View>

      {previewLoading ? (
        <View style={styles.previewLoader}>
          <ActivityIndicator color={colors.accent} />
          <Text variant="caption" tone="tertiary">
            Pulling album art from your Spotify…
          </Text>
        </View>
      ) : null}

      <View style={[isWide ? styles.cardRow : styles.cardStack, { gap: spacing.md, marginBottom: spacing.lg }]}>
        {IMPORT_PATHS.map((path) => (
          <ImportPathCard
            key={path.value}
            config={path}
            artworkUrls={previewArt[path.value]}
            selected={selectedRange === path.value}
            loading={loadingRange === path.value}
            songCount={selectedRange === path.value ? tracks.length : null}
            rankingMinutes={selectedRange === path.value ? rankingMinutes : null}
            onSelect={() => void handlePathAction(path.value)}
          />
        ))}
      </View>

      {statusMessage ? (
        <Card tone="muted" style={{ marginBottom: spacing.md, gap: spacing.xs }}>
          <Text variant="label">{statusMessage}</Text>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card
          style={[
            styles.messageBox,
            { marginBottom: spacing.md, borderColor: colors.error, gap: spacing.sm },
          ]}>
          <Text variant="label" tone="error">
            Could not load your songs
          </Text>
          <Text variant="bodySmall" tone="secondary">
            {errorMessage}
          </Text>
          {errorMessage.includes('access token') ? (
            <Button title="Sign in with Spotify again" variant="secondary" onPress={signOut} />
          ) : null}
        </Card>
      ) : null}

      {selectedRange && tracks.length > 0 ? (
        <Card elevated style={[styles.readyPanel, { marginBottom: spacing.xl, gap: spacing.md }]}>
          <View style={styles.readyHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="heading">Ready to rank {formatSongCount(tracks.length)}</Text>
              <Text variant="bodySmall" tone="secondary">
                About 3–5 quick comparisons per song · {rankingMinutes ?? 'a few minutes'} total
              </Text>
            </View>
            <ArtworkPreviewStack urls={artworkUrlsFromTracks(tracks)} size={36} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}>
            {tracks.slice(0, 8).map((track) => (
              <View key={track.id} style={[styles.previewTile, { borderRadius: radius.md }]}>
                <Image
                  source={{ uri: track.album.images[0]?.url }}
                  style={[styles.previewArt, { borderRadius: radius.md }]}
                  contentFit="cover"
                />
                <Text variant="caption" numberOfLines={1} style={styles.previewTitle}>
                  {track.name}
                </Text>
              </View>
            ))}
          </ScrollView>

          <Button title="Start ranking" onPress={() => void handleStartRanking()} loading={starting} />
        </Card>
      ) : null}

      <OnboardingUnlocks />

      <View style={[styles.dividerRow, { marginVertical: spacing.xl, gap: spacing.md }]}>
        <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
        <Text variant="caption" tone="tertiary">
          Or search Spotify manually
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.separator }]} />
      </View>

      <Pressable
        onPress={() => void handleManualSearch()}
        style={({ pressed }) => [
          styles.manualLink,
          {
            opacity: pressed ? 0.7 : 1,
            marginBottom: spacing['2xl'],
          },
        ]}
        accessibilityRole="button">
        <Text variant="label" tone="accent">
          Skip import and search songs
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  hero: {},
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headline: {
    maxWidth: 520,
  },
  subhead: {
    maxWidth: 560,
    lineHeight: 22,
  },
  benefitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  benefitText: {
    fontWeight: '500',
  },
  section: {},
  previewLoader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardStack: {
    flexDirection: 'column',
  },
  messageBox: {
    borderWidth: 1,
  },
  readyPanel: {
    borderCurve: 'continuous',
  },
  readyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewTile: {
    width: 88,
    gap: 6,
  },
  previewArt: {
    width: 88,
    height: 88,
    backgroundColor: '#1a1a1a',
    borderCurve: 'continuous',
  },
  previewTitle: {
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  manualLink: {
    alignSelf: 'center',
  },
});
