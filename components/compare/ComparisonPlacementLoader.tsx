import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
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
import { PLACEMENT_STATUS_MESSAGES, type PlacementSearchStep } from '@/lib/comparisonPlacement';
import type { Track } from '@/types';

const SUCCESS_HOLD_MS = 420;
const STEP_REVEAL_MS = 380;
const MIN_PLACEMENT_MS = 1100;

type Props = {
  track: Track;
  searchSteps: PlacementSearchStep[];
  comparisonCount: number;
  estimatedTotal: number;
  placementRank: number;
  placementScore: number;
  saveComplete: boolean;
  onFinished: () => void;
};

export function ComparisonPlacementLoader({
  track,
  searchSteps,
  comparisonCount,
  estimatedTotal,
  placementRank,
  placementScore,
  saveComplete,
  onFinished,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const [messageIndex, setMessageIndex] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [phase, setPhase] = useState<'searching' | 'success'>('searching');
  const startedAt = useRef(Date.now());
  const finishedRef = useRef(false);

  const targetProgress = estimatedTotal > 0 ? Math.min(comparisonCount / estimatedTotal, 1) : 1;
  const progress = useSharedValue(0);
  const floatY = useSharedValue(0);

  const message = useMemo(() => {
    if (phase === 'success') return 'Found placement.';
    if (saveComplete && revealedSteps >= searchSteps.length) {
      return PLACEMENT_STATUS_MESSAGES[4];
    }
    return PLACEMENT_STATUS_MESSAGES[messageIndex];
  }, [phase, saveComplete, revealedSteps, searchSteps.length, messageIndex]);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetProgress, progress]);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [floatY]);

  useEffect(() => {
    if (phase === 'success') return;

    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % PLACEMENT_STATUS_MESSAGES.length);
    }, 1900);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (searchSteps.length === 0) {
      setRevealedSteps(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    searchSteps.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setRevealedSteps(index + 1);
        }, (index + 1) * STEP_REVEAL_MS),
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [searchSteps]);

  useEffect(() => {
    if (!saveComplete || phase === 'success' || finishedRef.current) return;

    const stepsDone = revealedSteps >= searchSteps.length;
    const elapsed = Date.now() - startedAt.current;
    const minWait = Math.max(0, MIN_PLACEMENT_MS - elapsed);
    const stepsWait =
      searchSteps.length > 0
        ? Math.max(0, searchSteps.length * STEP_REVEAL_MS - elapsed)
        : 0;
    const delay = Math.max(minWait, stepsWait);

    const timer = setTimeout(() => {
      setPhase('success');
    }, delay);

    return () => clearTimeout(timer);
  }, [saveComplete, revealedSteps, searchSteps.length, phase]);

  useEffect(() => {
    if (phase !== 'success' || finishedRef.current) return;

    const timer = setTimeout(() => {
      finishedRef.current = true;
      onFinished();
    }, SUCCESS_HOLD_MS);

    return () => clearTimeout(timer);
  }, [phase, onFinished]);

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(progress.value, 0.04) }],
  }));

  const visibleSteps = searchSteps.slice(0, revealedSteps);

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.xl, gap: spacing.lg }]}>
      <Animated.View style={[styles.artworkWrap, artworkStyle]}>
        <Image
          source={{ uri: track.album_art_url ?? undefined }}
          style={[
            styles.artwork,
            {
              borderRadius: radius.lg,
              backgroundColor: colors.surfaceInset,
            },
          ]}
          contentFit="cover"
        />
      </Animated.View>

      <View style={[styles.trackMeta, { gap: spacing.xs }]}>
        <Text variant="title" numberOfLines={2} style={styles.centerText}>
          {track.name}
        </Text>
        <Text variant="bodySmall" tone="secondary" numberOfLines={1} style={styles.centerText}>
          {track.artist_names.join(', ')}
        </Text>
      </View>

      <View style={[styles.statusBlock, { gap: spacing.sm, width: '100%', maxWidth: 360 }]}>
        <Animated.View key={message} entering={FadeIn.duration(280)} exiting={FadeOut.duration(180)}>
          <Text variant="label" style={styles.centerText}>
            {message}
          </Text>
        </Animated.View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill },
          ]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: colors.accent, borderRadius: radius.pill },
              progressFillStyle,
            ]}
          />
        </View>

        <Text variant="caption" tone="tertiary" style={styles.centerText}>
          Comparison {comparisonCount} of {Math.max(estimatedTotal, comparisonCount, 1)}
        </Text>
      </View>

      {phase === 'searching' && visibleSteps.length > 0 ? (
        <View style={[styles.stepsBlock, { gap: spacing.xs, width: '100%', maxWidth: 280 }]}>
          <Text variant="caption" tone="tertiary">
            Searching your library...
          </Text>
          {visibleSteps.map((step, index) => (
            <Animated.View
              key={`${step.rank}-${index}`}
              entering={FadeIn.duration(240)}
              style={styles.stepRow}>
              <Text variant="caption" tone="accent">
                ✓
              </Text>
              <Text variant="caption" tone="secondary">
                Checking #{step.rank}
              </Text>
            </Animated.View>
          ))}
        </View>
      ) : null}

      {phase === 'success' ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.successBlock, { gap: spacing.xs, marginTop: spacing.xs }]}>
          <Text variant="label" tone="accent" style={styles.centerText}>
            ✓ Ranked
          </Text>
          <Text variant="bodySmall" tone="secondary" style={styles.centerText}>
            Placed #{placementRank} in your library
          </Text>
          <Text variant="metricSm" tone="score" style={styles.centerText}>
            {placementScore.toFixed(1)}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  artwork: {
    width: 168,
    height: 168,
  },
  trackMeta: {
    alignItems: 'center',
    maxWidth: 320,
  },
  centerText: {
    textAlign: 'center',
  },
  statusBlock: {
    alignItems: 'center',
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left center',
  },
  stepsBlock: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBlock: {
    alignItems: 'center',
  },
});
