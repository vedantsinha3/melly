import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { Track } from '@/types';

type SongCardProps = {
  track: Track;
  meta: string;
  onPress: () => void;
  selected: boolean;
  defeated: boolean;
  accessibilityLabel: string;
  artSize: number;
};

function ComparisonSongCard({
  track,
  meta,
  onPress,
  selected,
  defeated,
  accessibilityLabel,
  artSize,
}: SongCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, motion, elevation } = getTheme(colorScheme);
  const scale = useSharedValue(1);
  const artScale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withTiming(1.03, { duration: 280 });
      artScale.value = withTiming(1.04, { duration: 280 });
    } else if (defeated) {
      scale.value = withTiming(0.97, { duration: 280 });
    }
  }, [selected, defeated, scale, artScale]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: defeated ? 0.42 : 1,
  }));

  const artAnim = useAnimatedStyle(() => ({
    transform: [{ scale: artScale.value }],
  }));

  return (
    <Animated.View style={[styles.cardOuter, cardAnim]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed, hovered }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: 20,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? colors.accent : colors.border,
            ...(Platform.OS === 'web'
              ? { cursor: 'pointer' as const, transitionDuration: `${motion.normal}ms` }
              : null),
            ...(Platform.OS === 'web' && hovered && !selected && !defeated
              ? {
                  borderColor: colors.accent,
                  boxShadow: `0 12px 32px ${colors.shadow}`,
                  transform: [{ scale: 1.02 }],
                  backgroundColor: colors.surfaceMuted,
                }
              : elevation.subtle),
            opacity: pressed ? 0.92 : 1,
          },
        ]}>
        <Animated.View style={artAnim}>
          <Image
            source={{ uri: track.album_art_url ?? undefined }}
            style={[
              styles.artwork,
              {
                width: artSize,
                height: artSize,
                borderRadius: radius.md,
              },
            ]}
            contentFit="cover"
          />
        </Animated.View>
        <Text variant="heading" style={styles.title} numberOfLines={2}>
          {track.name}
        </Text>
        <Text variant="body" tone="secondary" style={styles.artist} numberOfLines={2}>
          {track.artist_names.join(', ')}
        </Text>
        <View
          style={[
            styles.metaPill,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 4,
            },
          ]}>
          <Text variant="caption" tone="tertiary">
            {meta}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function VsBadge() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, elevation } = getTheme(colorScheme);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
      2,
      false,
    );
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.vsWrap,
        anim,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...elevation.card,
        },
      ]}>
      <Text style={[styles.vsText, { color: colors.text }]}>VS</Text>
    </Animated.View>
  );
}

type Props = {
  newTrack: Track;
  compareTrack: Track;
  compareMeta: string;
  onPreferNew: () => void;
  onPreferCompare: () => void;
  disabled?: boolean;
};

export function ComparisonPair({
  newTrack,
  compareTrack,
  compareMeta,
  onPreferNew,
  onPreferCompare,
  disabled = false,
}: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const artSize = isWide ? 168 : width >= 400 ? 148 : 132;
  const [winner, setWinner] = useState<'new' | 'compare' | null>(null);

  const pick = (side: 'new' | 'compare', callback: () => void) => {
    if (disabled || winner) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWinner(side);
    setTimeout(() => {
      callback();
      setWinner(null);
    }, 380);
  };

  const newArtists = newTrack.artist_names.join(', ');
  const compareArtists = compareTrack.artist_names.join(', ');

  return (
    <Animated.View entering={FadeIn.duration(280)} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.duelRow, isWide ? styles.duelRowWide : null]}>
        <ComparisonSongCard
          track={newTrack}
          meta="New song"
          selected={winner === 'new'}
          defeated={winner === 'compare'}
          onPress={() => pick('new', onPreferNew)}
          accessibilityLabel={`Choose ${newTrack.name} by ${newArtists}`}
          artSize={artSize}
        />

        <VsBadge />

        <ComparisonSongCard
          track={compareTrack}
          meta={compareMeta}
          selected={winner === 'compare'}
          defeated={winner === 'new'}
          onPress={() => pick('compare', onPreferCompare)}
          accessibilityLabel={`Choose ${compareTrack.name} by ${compareArtists}`}
          artSize={artSize}
        />
      </View>

      <Text variant="caption" tone="tertiary" style={styles.hint}>
        Tap the song that deserves the higher spot
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
  },
  duelRow: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  duelRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cardOuter: {
    flex: 1,
    minWidth: 260,
    maxWidth: 340,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    borderCurve: 'continuous',
  },
  artwork: {
    backgroundColor: '#1a1a1a',
    borderCurve: 'continuous',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  artist: {
    textAlign: 'center',
    fontSize: 14,
  },
  metaPill: {
    marginTop: 2,
  },
  vsWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  vsText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  hint: {
    textAlign: 'center',
    width: '100%',
  },
});
