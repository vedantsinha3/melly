import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { getProgressMilestoneColor } from '@/lib/albums';

type Props = {
  completionPct: number | null;
  isComplete: boolean;
  showLabel?: boolean;
  height?: number;
  animated?: boolean;
};

export function AlbumProgressBar({
  completionPct,
  isComplete,
  showLabel = false,
  height = 6,
  animated = false,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius } = getTheme(colorScheme);
  const pct = isComplete ? 100 : Math.max(0, completionPct ?? 0);
  const fillColor = getProgressMilestoneColor(completionPct, isComplete, colorScheme);

  return (
    <View style={{ gap: 4 }}>
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
          {isComplete ? '100% Complete' : `${pct}% complete`}
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
