import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { RatingWithTrack } from '@/types';

type Props = {
  rating: RatingWithTrack;
  onPress: () => void;
  highlighted?: boolean;
};

export function RankedListItem({ rating, onPress, highlighted }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: highlighted ? colors.surface : colors.background,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[styles.rank, { color: colors.textSecondary }]}>
        {rating.rank_position}
      </Text>
      <Image
        source={{ uri: rating.track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {rating.track.name}
        </Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
          {rating.track.artist_names.join(', ')}
        </Text>
      </View>
      <Text style={[styles.score, { color: colors.score }]}>
        {Number(rating.score).toFixed(1)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rank: {
    width: 28,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    fontSize: 13,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});
