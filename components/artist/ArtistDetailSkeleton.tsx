import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export function ArtistDetailSkeleton() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  const bone = { backgroundColor: colors.surfaceInset, borderRadius: radius.md };

  return (
    <View style={{ gap: spacing.lg, padding: spacing.lg }}>
      <Card style={{ gap: spacing.md, padding: spacing.lg }}>
        <View style={[styles.heroArt, bone]} />
        <View style={[styles.line, bone, { width: '40%' }]} />
        <View style={[styles.lineLg, bone, { width: '70%' }]} />
        <View style={styles.statRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.statBone, bone]} />
          ))}
        </View>
      </Card>
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.gridBone, bone]} />
        ))}
      </View>
      <View style={[styles.chartBone, bone]} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.rowBone, bone]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heroArt: {
    height: 180,
    width: '100%',
  },
  line: {
    height: 12,
  },
  lineLg: {
    height: 28,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBone: {
    flex: 1,
    height: 44,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridBone: {
    width: '31%',
    minWidth: 100,
    height: 72,
    flexGrow: 1,
  },
  chartBone: {
    height: 200,
  },
  rowBone: {
    height: 72,
  },
});
