import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/ui';
import type { Track } from '@/types';

type Props = {
  track: Track;
  onPress?: () => void;
  subtitle?: string;
  rightElement?: React.ReactNode;
};

export function SongCard({ track, onPress, subtitle, rightElement }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, elevation, radius, spacing } = getTheme(colorScheme);

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
        },
        elevation.card,
      ]}>
      <Image
        source={{ uri: track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text variant="label" numberOfLines={1}>
          {track.name}
        </Text>
        <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
          {subtitle ?? track.artist_names.join(', ')}
        </Text>
      </View>
      {rightElement}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderCurve: 'continuous',
    gap: 12,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    gap: 4,
  },
});
