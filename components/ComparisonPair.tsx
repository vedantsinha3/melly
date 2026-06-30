import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
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
  colors,
}: {
  track: Track;
  label: string;
  onPress: () => void;
  colors: (typeof Colors)['light'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Image
        source={{ uri: track.album_art_url ?? undefined }}
        style={styles.artwork}
        contentFit="cover"
      />
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {track.name}
      </Text>
      <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
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
  const colors = Colors[colorScheme];

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
        colors={colors}
      />
      <Text style={[styles.vs, { color: colors.textSecondary }]}>vs</Text>
      <TrackCard
        track={compareTrack}
        label="In your list"
        onPress={handlePreferCompare}
        colors={colors}
      />
      <View style={styles.hints}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
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
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    maxHeight: 280,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  artwork: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  artist: {
    fontSize: 14,
    textAlign: 'center',
  },
  vs: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  hints: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hint: {
    fontSize: 14,
  },
});
