import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { TasteProfileModule } from '@/lib/scoreHistogram';

type Props = {
  profile: TasteProfileModule | null;
};

export function TasteProfileSummary({ profile }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  if (!profile) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.md,
          padding: spacing.md,
          marginTop: spacing.sm,
          gap: spacing.sm,
        },
      ]}>
      <View style={styles.header}>
        <SymbolView
          name={{ ios: 'headphones', android: 'headphones', web: 'headphones' }}
          tintColor={colors.accent}
          size={14}
        />
        <Text variant="overline" tone="tertiary" style={styles.headerLabel}>
          Taste Profile
        </Text>
      </View>

      <View style={styles.personaRow}>
        <View
          style={[
            styles.personaPill,
            {
              backgroundColor: colors.accentSoft,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
            },
          ]}>
          <Text variant="label" tone="accent" style={styles.personaText}>
            {profile.personaTitle}
          </Text>
        </View>
        <Text variant="caption" tone="tertiary" style={styles.confidence}>
          {profile.confidenceLabel}
        </Text>
      </View>

      <Text variant="bodySmall" tone="secondary" style={styles.insight}>
        {profile.insight}
      </Text>

      <Text variant="caption" tone="tertiary" style={styles.statsLine}>
        {profile.statsLine}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    letterSpacing: 0.5,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  personaPill: {
    alignSelf: 'flex-start',
  },
  personaText: {
    fontWeight: '600',
    fontSize: 13,
  },
  confidence: {
    fontSize: 11,
  },
  insight: {
    lineHeight: 19,
  },
  statsLine: {
    fontVariant: ['tabular-nums'],
    fontSize: 11,
    marginTop: 2,
  },
});
