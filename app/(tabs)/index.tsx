import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RankedListItem } from '@/components/RankedListItem';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchRankedRatings } from '@/lib/ranking';
import type { RatingWithTrack } from '@/types';

export default function RankedListScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { highlight } = useLocalSearchParams<{ highlight?: string }>();

  const [ratings, setRatings] = useState<RatingWithTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRatings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchRankedRatings(user.id);
      setRatings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRatings();
    }, [loadRatings]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRatings();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {ratings.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No songs yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Log your first song to start building your ranked list.
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.ctaText}>Log a song</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          renderItem={({ item }) => (
            <RankedListItem
              rating={item}
              highlighted={item.id === highlight}
              onPress={() => router.push(`/song/${item.id}`)}
            />
          )}
        />
      )}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={[styles.signOutText, { color: colors.textSecondary }]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOut: {
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 14,
  },
});
