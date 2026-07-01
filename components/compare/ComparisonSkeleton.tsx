import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export function ComparisonSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const isWide = width >= 720;
  const artSize = isWide ? 160 : 140;

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}>
      <View
        style={[
          styles.art,
          {
            width: artSize,
            height: artSize,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      />
      <View style={[styles.line, { width: '72%', backgroundColor: colors.surfaceMuted }]} />
      <View style={[styles.line, { width: '48%', backgroundColor: colors.surfaceMuted }]} />
      <View style={[styles.lineSm, { width: '36%', backgroundColor: colors.surfaceMuted }]} />
    </View>
  );

  return (
    <View style={[styles.wrap, isWide ? styles.wrapWide : null]}>
      {isWide ? (
        <>
          {card}
          <View style={[styles.vs, { backgroundColor: colors.surfaceMuted }]} />
          {card}
        </>
      ) : (
        <>
          {card}
          <View style={[styles.vs, { backgroundColor: colors.surfaceMuted }]} />
          {card}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    alignItems: 'center',
    width: '100%',
  },
  wrapWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    flex: 1,
    maxWidth: 320,
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  art: {
    borderCurve: 'continuous',
  },
  line: {
    height: 14,
    borderRadius: 7,
  },
  lineSm: {
    height: 10,
    borderRadius: 5,
  },
  vs: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
