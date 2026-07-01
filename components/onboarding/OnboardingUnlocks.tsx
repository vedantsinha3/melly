import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { UNLOCK_FEATURES } from '@/lib/onboarding';

export function OnboardingUnlocks() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  return (
    <View style={[styles.wrap, { gap: spacing.md }]}>
      <View style={{ gap: 4 }}>
        <Text variant="heading">What you&apos;ll unlock</Text>
        <Text variant="bodySmall" tone="secondary">
          A few minutes of ranking opens a personalized music dashboard.
        </Text>
      </View>

      <View style={[styles.grid, { gap: spacing.sm }]}>
        {UNLOCK_FEATURES.map((feature) => (
          <View
            key={feature.id}
            style={[
              styles.feature,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                gap: spacing.sm,
                borderColor: colors.border,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft, borderRadius: radius.md }]}>
              <SymbolView name={feature.icon} tintColor={colors.accent} size={16} />
            </View>
            <View style={styles.copy}>
              <Text variant="label">{feature.title}</Text>
              <Text variant="caption" tone="tertiary" numberOfLines={2}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '48%',
    minWidth: 148,
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
