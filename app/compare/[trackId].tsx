import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ComparisonPair } from '@/components/ComparisonPair';
import { ComparisonProgress } from '@/components/compare/ComparisonProgress';
import { ComparisonSkeleton } from '@/components/compare/ComparisonSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import { Button, Screen, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { markOnboardingCompleted } from '@/lib/profile';
import {
  applyComparison,
  estimateComparisonCount,
  estimatePlacement,
  fetchRankedRatings,
  finalizeRating,
  getComparisonIndex,
  insertFirstRating,
  isComparisonComplete,
} from '@/lib/ranking';
import { supabase } from '@/lib/supabase';
import type { RatingWithTrack, Track } from '@/types';

function buildCompareMeta(rating: RatingWithTrack, low: number, high: number, listLength: number): string {
  const rank = rating.rank_position;
  const score = Number(rating.score).toFixed(1);
  const rangeSpan = high - low;

  if (listLength <= 1) {
    return `Currently #${rank} · Rated ${score}`;
  }

  if (rangeSpan <= 2) {
    return `Closest match · #${rank} · ${score}`;
  }

  return `Currently #${rank} · Rated ${score}`;
}

export default function CompareScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();
  const { isActive, getProgress, advanceToNext, clearQueue } = useImportQueue();
  const queueProgress = getProgress();

  const [newTrack, setNewTrack] = useState<Track | null>(null);
  const [rankedList, setRankedList] = useState<RatingWithTrack[]>([]);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [comparisonsMade, setComparisonsMade] = useState(0);
  const [comparisonLog, setComparisonLog] = useState<
    { comparedTrackId: string; preferredTrackId: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleQueueAdvance = useCallback(
    async (ratingId: string) => {
      if (!user) return;

      if (isActive) {
        const nextTrackId = advanceToNext();
        if (nextTrackId) {
          router.replace(`/compare/${nextTrackId}`);
          return;
        }

        await markOnboardingCompleted(user.id);
        clearQueue();
      }

      router.replace({ pathname: '/(tabs)', params: { highlight: ratingId } });
    },
    [user, isActive, advanceToNext, clearQueue, router],
  );

  const loadData = useCallback(async () => {
    if (!user || !trackId) return;

    setLoading(true);
    setLoadError(null);
    setComparisonsMade(0);
    setComparisonLog([]);
    setLow(0);

    try {
      const [{ data: track, error: trackError }, ratings] = await Promise.all([
        supabase.from('tracks').select('*').eq('spotify_id', trackId).single(),
        fetchRankedRatings(user.id),
      ]);

      if (trackError) throw trackError;
      setNewTrack(track as Track);
      setRankedList(ratings);
      setHigh(ratings.length);

      if (ratings.length === 0) {
        setSubmitting(true);
        const ratingId = await insertFirstRating(user.id, trackId);
        await handleQueueAdvance(ratingId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load';
      setLoadError(message);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }, [user, trackId, handleQueueAdvance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const finishComparison = useCallback(
    async (
      insertionIndex: number,
      comparisons: { comparedTrackId: string; preferredTrackId: string }[],
    ) => {
      if (!user || !trackId) return;

      setSubmitting(true);
      try {
        const ratingId = await finalizeRating(user.id, trackId, insertionIndex, comparisons);
        await handleQueueAdvance(ratingId);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save rating');
        setSubmitting(false);
      }
    },
    [user, trackId, handleQueueAdvance],
  );

  const handleChoice = useCallback(
    (preferNew: boolean) => {
      if (!newTrack) return;

      const mid = getComparisonIndex(low, high);
      const compareRating = rankedList[mid];

      const newComparison = {
        comparedTrackId: compareRating.track.spotify_id,
        preferredTrackId: preferNew ? newTrack.spotify_id : compareRating.track.spotify_id,
      };
      const updatedLog = [...comparisonLog, newComparison];

      setComparisonLog(updatedLog);
      setComparisonsMade((prev) => prev + 1);

      const next = applyComparison(low, high, preferNew);
      setLow(next.low);
      setHigh(next.high);

      if (isComparisonComplete(next.low, next.high)) {
        finishComparison(next.low, updatedLog);
      }
    },
    [newTrack, rankedList, low, high, comparisonLog, finishComparison],
  );

  const estimatedTotal = estimateComparisonCount(rankedList.length);
  const placement = useMemo(
    () => estimatePlacement(low, high, rankedList.length, comparisonsMade),
    [low, high, rankedList.length, comparisonsMade],
  );

  if (loadError) {
    return (
      <Screen contentStyle={styles.centered}>
        <Text variant="heading" style={styles.errorTitle}>
          Couldn't load this comparison
        </Text>
        <Text variant="bodySmall" tone="secondary" style={styles.errorBody}>
          {loadError}
        </Text>
        <Button title="Try again" onPress={loadData} />
        <Button title="Go back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen contentStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.skelLine, { backgroundColor: colors.surfaceMuted, width: 180 }]} />
          <View style={[styles.skelLine, { backgroundColor: colors.surfaceMuted, width: '100%' }]} />
        </View>
        <ComparisonSkeleton />
      </Screen>
    );
  }

  if (submitting) {
    return (
      <Screen contentStyle={styles.centered}>
        <Text variant="heading">Placing your song…</Text>
        <Text variant="bodySmall" tone="secondary">
          Updating your ranking
        </Text>
      </Screen>
    );
  }

  if (!newTrack || rankedList.length === 0) {
    return null;
  }

  const mid = getComparisonIndex(low, high);
  const compareRating = rankedList[mid];
  const compareMeta = buildCompareMeta(compareRating, low, high, rankedList.length);
  const queueLabel = isActive
    ? `Ranking song ${queueProgress.current} of ${queueProgress.total}`
    : null;

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        <ComparisonProgress
          current={comparisonsMade + 1}
          total={estimatedTotal}
          queueLabel={queueLabel}
        />
        <Text variant="title" style={styles.prompt}>
          Which song deserves the higher spot?
        </Text>
        <View style={[styles.estimateRow, { backgroundColor: colors.surfaceMuted, borderRadius: 12 }]}>
          <Text variant="caption" tone="secondary">
            Estimated rating{' '}
            <Text variant="label">{placement.estimatedScore.toFixed(1)}</Text>
            {' · '}
            Likely near <Text variant="label">#{placement.estimatedRank}</Text>
            {' · '}
            <Text variant="caption" tone="tertiary">
              {placement.confidence}% confidence
            </Text>
          </Text>
        </View>
      </View>

      <ComparisonPair
        key={`${compareRating.track.spotify_id}-${comparisonsMade}`}
        newTrack={newTrack}
        compareTrack={compareRating.track}
        compareMeta={compareMeta}
        onPreferNew={() => handleChoice(true)}
        onPreferCompare={() => handleChoice(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    gap: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  prompt: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  estimateRow: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 520,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorBody: {
    textAlign: 'center',
    marginBottom: 8,
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
});
