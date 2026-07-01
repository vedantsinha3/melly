import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { DetailShell } from '@/components/navigation/DetailShell';
import { RankedListItem } from '@/components/RankedListItem';
import { Button, Card, LoadingState, Screen, Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchRankedRatings } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

export default function AlbumDetailScreen() {
  const { albumName } = useLocalSearchParams<{ albumName: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);

  const decodedName = decodeURIComponent(albumName ?? '');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await fetchRankedRatings(user.id);
      const albumRatings = all.filter(
        (r) => r.track.album_name?.trim().toLowerCase() === decodedName.toLowerCase(),
      );
      setRatings(albumRatings);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, decodedName]);

  useEffect(() => {
    load();
  }, [load]);

  const averageScore = useMemo(() => {
    if (ratings.length === 0) return 0;
    return Number(
      (ratings.reduce((sum, r) => sum + Number(r.score), 0) / ratings.length).toFixed(1),
    );
  }, [ratings]);

  if (loading) {
    return (
      <DetailShell title="Album">
        <LoadingState />
      </DetailShell>
    );
  }

  if (ratings.length === 0) {
    return (
      <DetailShell title="Album">
        <Screen contentStyle={styles.empty} omitSafeArea>
          <Text variant="heading">No ranked songs from this album</Text>
          <Button title="Go back" variant="secondary" onPress={() => router.back()} />
        </Screen>
      </DetailShell>
    );
  }

  const artwork = ratings.find((r) => r.track.album_art_url)?.track.album_art_url;

  return (
    <DetailShell title={decodedName}>
      <Screen scroll edgeToEdge wide omitSafeArea contentStyle={{ gap: spacing.lg, paddingBottom: spacing['2xl'] }}>
      <Card style={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={styles.heroRow}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={[styles.art, { borderRadius: radius.lg }]} />
          ) : null}
          <View style={styles.heroCopy}>
            <Text variant="overline" tone="tertiary">
              Album in your library
            </Text>
            <Text variant="title">{decodedName}</Text>
            <Text variant="bodySmall" tone="secondary">
              {averageScore.toFixed(1)} average · {ratings.length}{' '}
              {ratings.length === 1 ? 'song' : 'songs'} ranked
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {ratings
          .sort((a, b) => Number(b.score) - Number(a.score))
          .map((rating) => (
            <RankedListItem
              key={rating.id}
              rating={rating}
              onPress={() => router.push(`/song/${rating.id}`)}
            />
          ))}
      </View>
      </Screen>
    </DetailShell>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  art: {
    width: 88,
    height: 88,
    backgroundColor: '#1a1a1a',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
});
