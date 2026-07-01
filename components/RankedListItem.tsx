import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/ui';
import type { RatingWithTrack } from '@/types';

type Props = {
  rating: RatingWithTrack;
  onPress: () => void;
  highlighted?: boolean;
};

export function RankedListItem({ rating, onPress, highlighted }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, elevation } = getTheme(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: highlighted ? colors.accentSoft : colors.surface,
          borderColor: highlighted ? colors.accent : colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          opacity: pressed ? 0.7 : 1,
        },
        elevation.card,
      ]}>
      <Text
        style={[
          styles.rank,
          {
            color: highlighted ? colors.accent : colors.textSecondary,
            backgroundColor: highlighted ? colors.surface : colors.surfaceMuted,
            borderRadius: radius.pill,
          },
        ]}>
        {rating.rank_position}
      </Text>
      <Image
        source={{ uri: rating.track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text variant="label" numberOfLines={1}>
          {rating.track.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {rating.track.artist_names.join(', ')}
        </Text>
      </View>
      <View style={[styles.scorePill, { backgroundColor: colors.accentSoft }]}>
        <Text variant="label" tone="score" style={styles.score}>
          {Number(rating.score).toFixed(1)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 12,
  },
  rank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 34,
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
  scorePill: {
    minWidth: 48,
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  score: {
    fontVariant: ['tabular-nums'],
  },
});
