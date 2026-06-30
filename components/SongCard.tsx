import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { Track } from '@/types';

type Props = {
  track: Track;
  onPress?: () => void;
  subtitle?: string;
  rightElement?: React.ReactNode;
};

export function SongCard({ track, onPress, subtitle, rightElement }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const content = (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri: track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
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
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    fontSize: 14,
  },
});
