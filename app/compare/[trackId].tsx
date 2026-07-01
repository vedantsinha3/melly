import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ComparisonPair } from '@/components/ComparisonPair';
import { useColorScheme } from '@/components/useColorScheme';
import { LoadingState, Screen, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useImportQueue } from '@/contexts/ImportQueueContext';
import { markOnboardingCompleted } from '@/lib/profile';
import {
  applyComparison,
  estimateComparisonCount,
  fetchRankedRatings,
  finalizeRating,
  getComparisonIndex,
  insertFirstRating,
  isComparisonComplete,
} from '@/lib/ranking';
import { supabase } from '@/lib/supabase';
import type { RatingWithTrack, Track } from '@/types';

export default function CompareScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
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

  useEffect(() => {
    async function load() {
      if (!user || !trackId) return;

      setLoading(true);
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
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load');
        router.back();
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    }

    load();
  }, [user, trackId, router, handleQueueAdvance]);

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
      const compareTrack = rankedList[mid];

      const newComparison = {
        comparedTrackId: compareTrack.track.spotify_id,
        preferredTrackId: preferNew ? newTrack.spotify_id : compareTrack.track.spotify_id,
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

  if (loading || submitting) {
    return <LoadingState message={submitting ? 'Saving your ranking...' : undefined} />;
  }

  if (!newTrack || rankedList.length === 0) {
    return null;
  }

  const mid = getComparisonIndex(low, high);
  const compareTrack = rankedList[mid];
  const estimatedTotal = estimateComparisonCount(rankedList.length);

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.header}>
        {isActive ? (
          <Text
            style={[
              styles.queueProgress,
              { color: colors.accent, backgroundColor: colors.accentSoft },
            ]}>
            Ranking song {queueProgress.current} of {queueProgress.total}
          </Text>
        ) : null}
        <Text variant="bodySmall" tone="secondary" style={styles.progress}>
          {comparisonsMade + 1} of ~{estimatedTotal} comparisons
        </Text>
        <Text variant="title" style={styles.prompt}>
          Which do you prefer?
        </Text>
      </View>

      <ComparisonPair
        newTrack={newTrack}
        compareTrack={compareTrack.track}
        onPreferNew={() => handleChoice(true)}
        onPreferCompare={() => handleChoice(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    gap: 8,
  },
  queueProgress: {
    alignSelf: 'center',
    borderRadius: 999,
    fontSize: 15,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 7,
    textAlign: 'center',
  },
  progress: {
    textAlign: 'center',
  },
  prompt: { textAlign: 'center' },
});
