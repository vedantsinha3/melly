import { StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  rows?: number;
};

export function LibrarySearchSkeleton({ rows = 4 }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.sm,
            },
          ]}>
          <View style={[styles.art, { backgroundColor: colors.surfaceInset, borderRadius: radius.sm }]} />
          <View style={styles.copy}>
            <View style={[styles.line, styles.lineMd, { backgroundColor: colors.surfaceInset }]} />
            <View style={[styles.line, styles.lineSm, { backgroundColor: colors.surfaceMuted }]} />
          </View>
          <View style={[styles.button, { backgroundColor: colors.surfaceInset, borderRadius: radius.md }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  art: {
    width: 48,
    height: 48,
  },
  copy: {
    flex: 1,
    gap: 8,
  },
  line: {
    borderRadius: 4,
    height: 10,
  },
  lineMd: {
    width: '62%',
  },
  lineSm: {
    width: '42%',
  },
  button: {
    width: 108,
    height: 36,
  },
});
