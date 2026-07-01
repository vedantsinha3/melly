import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  insights: string[];
};

export function ArtistInsights({ insights }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  if (insights.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">Insights</Text>
      <Card style={{ gap: spacing.sm, padding: spacing.md }}>
        {insights.map((insight, index) => (
          <View key={index} style={[styles.row, { gap: spacing.sm }]}>
            <View style={[styles.icon, { backgroundColor: colors.accentSoft, borderRadius: radius.md }]}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor={colors.accent}
                size={14}
              />
            </View>
            <Text variant="bodySmall" tone="secondary" style={styles.text}>
              {insight}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  text: {
    flex: 1,
    lineHeight: 20,
  },
});
