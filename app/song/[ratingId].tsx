import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PreviewPlayer } from '@/components/PreviewPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { deleteRating, fetchRatingById, updateRatingNotes } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

export default function SongDetailScreen() {
  const { ratingId } = useLocalSearchParams<{ ratingId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const listenedDate = new Date(rating.listened_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Image
        source={{ uri: rating.track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
      />

      <Text style={[styles.rank, { color: colors.textSecondary }]}>
        #{rating.rank_position} in your list
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>{rating.track.name}</Text>
      <Text style={[styles.artist, { color: colors.textSecondary }]}>
        {rating.track.artist_names.join(', ')}
      </Text>
      <Text style={[styles.album, { color: colors.textSecondary }]}>{rating.track.album_name}</Text>

      <View style={[styles.scoreBadge, { backgroundColor: colors.surface }]}>
        <Text style={[styles.score, { color: colors.score }]}>
          {Number(rating.score).toFixed(1)}
        </Text>
        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>/ 10</Text>
      </View>

      <PreviewPlayer previewUrl={rating.track.preview_url} />

      <Text style={[styles.date, { color: colors.textSecondary }]}>Logged {listenedDate}</Text>

      <View style={styles.notesSection}>
        <Text style={[styles.notesLabel, { color: colors.text }]}>Notes</Text>
        <TextInput
          style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          placeholder="Add notes about this song..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <Pressable
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSaveNotes}
          disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save notes'}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={[styles.deleteText, { color: colors.error }]}>Remove from list</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#333',
    marginBottom: 16,
  },
  rank: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    textAlign: 'center',
  },
  album: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    marginVertical: 8,
  },
  score: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 16,
  },
  date: {
    fontSize: 13,
    marginTop: 8,
  },
  notesSection: {
    width: '100%',
    marginTop: 24,
    gap: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 24,
    padding: 12,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
