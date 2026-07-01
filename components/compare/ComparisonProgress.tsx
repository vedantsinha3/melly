import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  current: number;
  total: number;
  queueLabel?: string | null;
};

export function ComparisonProgress({ current, total, queueLabel }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const progress = total > 0 ? Math.min(current / total, 1) : 0;
  const remaining = Math.max(total - current, 0);
  const helper =
    total <= 1
      ? 'Final comparison'
      : remaining === 0
        ? 'Final comparison'
        : remaining <= 2
          ? `${remaining} comparison${remaining === 1 ? '' : 's'} remaining`
          : 'A few picks to place this song';

  return (
    <View style={[styles.wrap, { gap: spacing.sm, maxWidth: isWide ? 480 : undefined }]}>
      {queueLabel ? (
        <Text variant="caption" tone="accent" style={styles.queue}>
          {queueLabel}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text variant="label" style={styles.label}>
          Comparison {current} of {total}
        </Text>
        <Text variant="caption" tone="tertiary">
          {helper}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: colors.accent,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'center',
  },
  queue: {
    textAlign: 'center',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontWeight: '600',
  },
  track: {
    height: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
