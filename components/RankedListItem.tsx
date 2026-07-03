import { Pressable, StyleSheet, View } from 'react-native';

import { Artwork, Pill, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
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
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.md,
          opacity: pressed ? 0.7 : 1,
        },
        elevation.card,
      ]}>
      <Pill variant="rank" label={String(rating.rank_position)} />
      <Artwork uri={rating.track.album_art_url} size="xs" borderRadius="sm" />
      <View style={styles.info}>
        <Text variant="label" numberOfLines={1}>
          {rating.track.name}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {rating.track.artist_names.join(', ')}
        </Text>
      </View>
      <Pill variant="score" label={Number(rating.score).toFixed(1)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
});
