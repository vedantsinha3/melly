import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Coverage = { withNotes?: number; withPreview?: number; total: number; pct: number };

type Props = {
  notesCoverage: Coverage;
  previewCoverage: Coverage;
};

export function DashboardCollectionMeta({ notesCoverage, previewCoverage }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  const chips: Array<{ label: string; value: string }> = [];

  if (notesCoverage.total > 0 && notesCoverage.pct > 0) {
    chips.push({
      label: 'Notes',
      value: `${notesCoverage.pct}%`,
    });
  }
  if (previewCoverage.total > 0 && previewCoverage.pct > 0) {
    chips.push({
      label: 'Previews',
      value: `${previewCoverage.pct}%`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {chips.map((chip) => (
        <View
          key={chip.label}
          style={[
            styles.chip,
            {
              backgroundColor: colors.surfaceMuted,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
            },
          ]}>
          <Text variant="caption" tone="tertiary">
            {chip.label}
          </Text>
          <Text variant="caption" tone="secondary" style={{ fontWeight: '500' }}>
            {chip.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
