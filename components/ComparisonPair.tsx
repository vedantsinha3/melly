import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
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
  metaVariant: 'new' | 'ranked';
  side: 'left' | 'right';
  onPress: () => void;
  selected: boolean;
  defeated: boolean;
  accessibilityLabel: string;
  artSize: number;
};

function ComparisonSongCard({
  track,
  meta,
  metaVariant,
  side,
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
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (selected) {
      scale.value = withTiming(1.035, { duration: 260 });
      artScale.value = withTiming(1.05, { duration: 240 });
    } else if (defeated) {
      scale.value = withTiming(0.965, { duration: 260 });
      artScale.value = withTiming(1, { duration: 180 });
    } else if (isHovered) {
      scale.value = withTiming(1.015, { duration: 180 });
      artScale.value = withTiming(1.02, { duration: 180 });
    } else {
      scale.value = withTiming(1, { duration: 180 });
      artScale.value = withTiming(1, { duration: 180 });
    }
  }, [selected, defeated, isHovered, scale, artScale]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: defeated ? 0.42 : 1,
  }));

  const artAnim = useAnimatedStyle(() => ({
    transform: [{ scale: artScale.value }],
  }));

  return (
    <Animated.View
      entering={(side === 'left' ? FadeInLeft : FadeInRight).duration(220)}
      style={[styles.cardOuter, cardAnim]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed, hovered }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: 18,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? colors.accent : colors.border,
            ...(Platform.OS === 'web'
              ? { cursor: 'pointer' as const, transitionDuration: `${motion.fast}ms` }
              : null),
            ...(Platform.OS === 'web' && hovered && !selected && !defeated
              ? {
                  borderColor: colors.accent,
                  boxShadow: `0 14px 30px ${colors.shadow}`,
                  backgroundColor: colors.surfaceMuted,
                }
              : elevation.subtle),
            ...(isFocused
              ? {
                  borderColor: colors.accent,
                  boxShadow: `0 0 0 3px ${colors.accentSoft}`,
                }
              : null),
            ...(pressed && !defeated
              ? {
                  transform: [{ scale: 0.99 }],
                  borderColor: colors.accent,
                  backgroundColor: colors.surfaceMuted,
                }
              : null),
            opacity: pressed && !defeated ? 0.96 : 1,
          },
        ]}
        {...(Platform.OS === 'web'
          ? {
              onKeyDown: (event: { key?: string; preventDefault?: () => void }) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault?.();
                  onPress();
                }
              },
            }
          : null)}>
        <Animated.View style={artAnim}>
          <View
            style={[
              styles.artFrame,
              {
                width: artSize,
                height: artSize,
                borderRadius: radius.md,
              },
            ]}>
            <Image
              source={{ uri: track.album_art_url ?? undefined }}
              style={[
                styles.artwork,
                {
                  borderRadius: radius.md,
                },
              ]}
              contentFit="cover"
            />
          </View>
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
              backgroundColor: metaVariant === 'new' ? colors.accentSoft : colors.surfaceMuted,
              borderWidth: 1,
              borderColor: metaVariant === 'new' ? colors.accentMuted : colors.border,
              borderRadius: radius.pill,
              paddingHorizontal: 10,
              paddingVertical: 4,
            },
          ]}>
          <Text variant="caption" tone={metaVariant === 'new' ? 'accent' : 'tertiary'}>
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
    pulse.value = withSequence(withTiming(1.06, { duration: 280 }), withTiming(1, { duration: 300 }));
  }, [pulse]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={[
        styles.vsWrap,
        anim,
        {
          backgroundColor: colors.surface,
          borderColor: colors.accentMuted,
          boxShadow: `0 8px 24px ${colors.shadow}`,
          ...elevation.subtle,
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
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
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
    }, 320);
  };

  const newArtists = newTrack.artist_names.join(', ');
  const compareArtists = compareTrack.artist_names.join(', ');
  const winnerTrack = winner === 'new' ? newTrack.name : winner === 'compare' ? compareTrack.name : null;
  const loserTrack = winner === 'new' ? compareTrack.name : winner === 'compare' ? newTrack.name : null;

  return (
    <Animated.View entering={FadeIn.duration(280)} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.duelRow, isWide ? styles.duelRowWide : null]}>
        <View style={[styles.connector, { backgroundColor: colors.border }]} />
        <ComparisonSongCard
          track={newTrack}
          meta="New song"
          metaVariant="new"
          side="left"
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
          metaVariant="ranked"
          side="right"
          selected={winner === 'compare'}
          defeated={winner === 'new'}
          onPress={() => pick('compare', onPreferCompare)}
          accessibilityLabel={`Choose ${compareTrack.name} by ${compareArtists}`}
          artSize={artSize}
        />
      </View>

      {winnerTrack && loserTrack ? (
        <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(100)} style={styles.confirmation}>
          <Text variant="caption" tone="accent" style={styles.confirmTitle}>
            Nice choice.
          </Text>
          <Text variant="caption" tone="secondary" style={styles.confirmBody}>
            {winnerTrack} beats {loserTrack}
          </Text>
        </Animated.View>
      ) : null}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  duelRow: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    position: 'relative',
  },
  duelRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  connector: {
    position: 'absolute',
    top: '50%',
    left: '22%',
    right: '22%',
    height: StyleSheet.hairlineWidth,
    transform: [{ translateY: -0.5 }],
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
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderCurve: 'continuous',
  },
  artFrame: {
    overflow: 'hidden',
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
    fontWeight: '500',
  },
  confirmation: {
    alignItems: 'center',
    gap: 2,
    minHeight: 34,
  },
  confirmTitle: {
    fontWeight: '700',
  },
  confirmBody: {
    textAlign: 'center',
  },
});
