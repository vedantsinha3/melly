import { StyleSheet, View } from 'react-native';

import { ProgressBar, Text } from '@/components/ui';
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
      <View style={[styles.copy, { gap: spacing.xs }]}>
        <Text variant="heading">{headline}</Text>
        <Text variant="bodySmall" tone="secondary">
          {subline}
        </Text>
      </View>
      <ProgressBar
        value={completionPct}
        variant="accent"
        height={6}
        label={`Profile ${completionPct}% complete`}
        showLabel
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderCurve: 'continuous',
  },
  copy: {},
});
