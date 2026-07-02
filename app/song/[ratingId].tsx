import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DetailShell } from '@/components/navigation/DetailShell';
import {
  SongContextCards,
  SongHero,
  SongJourneyCard,
  SongNeighborsList,
  SongNotesSection,
  SongRankingNeighborhood,
} from '@/components/song';
import { Button, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import {
  deleteRating,
  fetchComparisonCountForTrack,
  fetchRankedRatings,
  fetchRatingById,
  updateRatingNotes,
} from '@/lib/ranking';
import { buildSongDetail } from '@/lib/songDetail';
import { goBackOrFallback } from '@/lib/navigation';

export default function SongDetailScreen() {
  const { ratingId } = useLocalSearchParams<{ ratingId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ReturnType<typeof buildSongDetail> | null>(null);

  const loadRating = useCallback(async () => {
    if (!user || !ratingId) return;
    try {
      const rating = await fetchRatingById(user.id, ratingId);
      if (!rating) {
        Alert.alert('Not found', 'This rating no longer exists.');
        goBackOrFallback(router, '/(tabs)/library');
        return;
      }

      const [allRatings, comparisonCount] = await Promise.all([
        fetchRankedRatings(user.id),
        fetchComparisonCountForTrack(user.id, rating.track.spotify_id),
      ]);

      setDetail(buildSongDetail(rating, allRatings, comparisonCount));
      setNotes(rating.notes ?? '');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, ratingId, router]);

  useEffect(() => {
    loadRating();
  }, [loadRating]);

  const openSong = useCallback(
    (id: string) => {
      if (id === ratingId) return;
      router.push(`/song/${id}`);
    },
    [router, ratingId],
  );

  const handleSaveNotes = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      await updateRatingNotes(detail.rating.id, notes);
      setDetail({
        ...detail,
        rating: { ...detail.rating, notes },
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user || !detail) return;

    Alert.alert('Delete rating', 'Remove this song from your ranked list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRating(user.id, detail.rating.id);
            goBackOrFallback(router, '/(tabs)/library');
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading || !detail) {
    return (
      <DetailShell title="Song">
        <LoadingState message="Loading your song profile…" />
      </DetailShell>
    );
  }

  return (
    <DetailShell title={detail.rating.track.name}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={styles.content}>
      <Animated.View entering={FadeIn.duration(300)} style={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
        <SongHero rating={detail.rating} heroSummary={detail.heroSummary} />

        <SongRankingNeighborhood neighbors={detail.neighbors} onSongPress={openSong} />

        <SongJourneyCard
          rankedAt={detail.journey.rankedAt}
          comparisonCount={detail.journey.comparisonCount}
          confidencePct={detail.journey.confidencePct}
          artistRankLabel={detail.journey.artistRankLabel}
        />

        <SongContextCards
          artist={detail.artistContext}
          album={detail.albumContext}
          onArtistPress={() =>
            router.push(`/artist/${encodeURIComponent(detail.artistContext.name)}`)
          }
          onAlbumPress={() =>
            router.push(`/album/${encodeURIComponent(detail.albumContext.key)}`)
          }
        />

        <SongNotesSection
          notes={notes}
          onChangeNotes={setNotes}
          onSave={handleSaveNotes}
          saving={saving}
          trackName={detail.rating.track.name}
        />

        <SongNeighborsList
          songs={detail.similarSongs}
          currentRank={detail.rating.rank_position}
          onSongPress={openSong}
        />

        <View style={styles.footer}>
          <Button title="Remove from list" variant="ghost" onPress={handleDelete} />
        </View>
      </Animated.View>
      </Screen>
    </DetailShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
});
