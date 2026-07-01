import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';

import { PreviewPlayer } from '@/components/PreviewPlayer';
import { Button, Card, LoadingState, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { deleteRating, fetchRatingById, updateRatingNotes } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

export default function SongDetailScreen() {
  const { ratingId } = useLocalSearchParams<{ ratingId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, elevation } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState<RatingWithTrack | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRating = useCallback(async () => {
    if (!user || !ratingId) return;
    try {
      const data = await fetchRatingById(user.id, ratingId);
      if (!data) {
        Alert.alert('Not found', 'This rating no longer exists.');
        router.back();
        return;
      }
      setRating(data);
      setNotes(data.notes ?? '');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, ratingId, router]);

  useEffect(() => {
    loadRating();
  }, [loadRating]);

  const handleSaveNotes = async () => {
    if (!rating) return;
    setSaving(true);
    try {
      await updateRatingNotes(rating.id, notes);
      Alert.alert('Saved', 'Notes updated.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!user || !rating) return;

    Alert.alert('Delete rating', 'Remove this song from your ranked list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRating(user.id, rating.id);
            router.back();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading || !rating) {
    return <LoadingState />;
  }

  const listenedDate = new Date(rating.listened_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Screen scroll contentStyle={styles.content}>
      <View
        style={[
          styles.artworkFrame,
          { backgroundColor: colors.surface, borderRadius: radius.md },
          elevation.raised,
        ]}>
        <Image
          source={{ uri: rating.track.album_art_url ?? undefined }}
          style={styles.artwork}
          contentFit="cover"
        />
      </View>

      <Text variant="bodySmall" tone="secondary">
        #{rating.rank_position} in your list
      </Text>
      <Text variant="title" style={styles.title}>
        {rating.track.name}
      </Text>
      <Text variant="body" tone="secondary" style={styles.artist}>
        {rating.track.artist_names.join(', ')}
      </Text>
      <Text variant="bodySmall" tone="secondary" style={styles.album}>
        {rating.track.album_name}
      </Text>

      <View style={[styles.scoreBadge, { backgroundColor: colors.accentSoft }]}>
        <Text variant="display" tone="score" style={styles.score}>
          {Number(rating.score).toFixed(1)}
        </Text>
        <Text variant="body" tone="secondary">
          / 10
        </Text>
      </View>

      <PreviewPlayer previewUrl={rating.track.preview_url} />

      <Text variant="caption" tone="secondary" style={styles.date}>
        Logged {listenedDate}
      </Text>

      <Card style={[styles.notesSection, { gap: spacing.sm }]}>
        <Text variant="label">Notes</Text>
        <TextField
          style={styles.notesInput}
          placeholder="Add notes about this song..."
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <Button title={saving ? 'Saving...' : 'Save notes'} onPress={handleSaveNotes} disabled={saving} />
      </Card>

      <Button title="Remove from list" variant="ghost" onPress={handleDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 48,
  },
  artworkFrame: {
    padding: 10,
    marginBottom: 16,
  },
  artwork: {
    width: 210,
    height: 210,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  title: { textAlign: 'center' },
  artist: { textAlign: 'center' },
  album: { textAlign: 'center', marginBottom: 8 },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 4,
    marginVertical: 8,
  },
  score: {
    lineHeight: 38,
  },
  date: { marginTop: 8 },
  notesSection: {
    width: '100%',
    marginTop: 24,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
