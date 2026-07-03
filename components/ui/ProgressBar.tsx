import { StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { getProgressMilestoneColor } from '@/lib/albums';
import { Text } from './Text';

type Props = {
  value: number;
  isComplete?: boolean;
  showLabel?: boolean;
  height?: number;
  /** Album completion uses milestone colors; profile progress uses accent only. */
  variant?: 'milestone' | 'accent';
  label?: string;
};

export function ProgressBar({
  value,
  isComplete = false,
  showLabel = false,
  height = 6,
  variant = 'milestone',
  label,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius, spacing } = getTheme(colorScheme);
  const pct = isComplete ? 100 : Math.max(0, Math.min(100, value));
  const fillColor =
    variant === 'accent'
      ? colors.accent
      : getProgressMilestoneColor(pct, isComplete, colorScheme);

  const defaultLabel = isComplete ? '100% Complete' : `${pct}% complete`;

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={[styles.track, { height, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              backgroundColor: fillColor,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>
      {showLabel ? (
        <Text variant="caption" tone={isComplete ? 'accent' : 'secondary'}>
          {label ?? defaultLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
