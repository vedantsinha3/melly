import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  headline: string;
  subline: string;
  completionPct: number;
};

export function LogSongProgressBanner({ headline, subline, completionPct }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        },
      ]}>
      <View style={styles.copy}>
        <Text variant="heading">{headline}</Text>
        <Text variant="bodySmall" tone="secondary">
          {subline}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${completionPct}%`,
              backgroundColor: colors.accent,
              borderRadius: radius.pill,
            },
          ]}
        />
      </View>
      <Text variant="caption" tone="tertiary">
        Profile {completionPct}% complete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderCurve: 'continuous',
  },
  copy: {
    gap: 4,
  },
  track: {
    height: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
