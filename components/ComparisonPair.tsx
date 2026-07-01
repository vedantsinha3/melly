import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from '@/components/ui';
import type { Track } from '@/types';

type Props = {
  newTrack: Track;
  compareTrack: Track;
  onPreferNew: () => void;
  onPreferCompare: () => void;
};

function TrackCard({
  track,
  label,
  onPress,
  theme,
}: {
  track: Track;
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof getTheme>;
}) {
  const { colors, radius, elevation } = theme;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          borderRadius: radius.md,
        },
        elevation.card,
      ]}>
      <Text variant="caption" tone="secondary" style={styles.label}>
        {label}
      </Text>
      <Image
        source={{ uri: track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
      />
      <Text variant="heading" style={styles.title} numberOfLines={2}>
        {track.name}
      </Text>
      <Text variant="bodySmall" tone="secondary" style={styles.artist} numberOfLines={1}>
        {track.artist_names.join(', ')}
      </Text>
    </Pressable>
  );
}

export function ComparisonPair({
  newTrack,
  compareTrack,
  onPreferNew,
  onPreferCompare,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = getTheme(colorScheme);
  const { colors } = theme;

  const handlePreferNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPreferNew();
  };

  const handlePreferCompare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPreferCompare();
  };

  return (
    <View style={styles.container}>
      <TrackCard
        track={newTrack}
        label="New song"
        onPress={handlePreferNew}
        theme={theme}
      />
      <View style={[styles.vsPill, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.vs, { color: colors.textSecondary }]}>VS</Text>
      </View>
      <TrackCard
        track={compareTrack}
        label="In your list"
        onPress={handlePreferCompare}
        theme={theme}
      />
      <View style={styles.hints}>
        <Text variant="bodySmall" tone="secondary" style={styles.hint}>
          Tap the song you prefer
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxHeight: 280,
  },
  label: {
    textTransform: 'uppercase',
  },
  artwork: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  title: { textAlign: 'center' },
  artist: {
    textAlign: 'center',
  },
  vsPill: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vs: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  hints: { alignItems: 'center', paddingTop: 8 },
  hint: {},
});
