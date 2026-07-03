import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type Variant = 'score' | 'rank' | 'success';

type Props = ViewProps & {
  variant: Variant;
  label: string;
  showSuccessIcon?: boolean;
};

export function Pill({ variant, label, showSuccessIcon = true, style, ...props }: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing } = getTheme(colorScheme);

  const isSuccess = variant === 'success';

  return (
    <View
      style={[
        styles.base,
        variant === 'score' && {
          backgroundColor: colors.accentSoft,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs + 2,
          minWidth: 44,
        },
        variant === 'rank' && {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          minWidth: 34,
        },
        variant === 'success' && {
          backgroundColor: colors.accent,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs + 2,
          gap: spacing.xs + 1,
        },
        style,
      ]}
      {...props}>
      {isSuccess && showSuccessIcon ? (
        <SymbolView
          name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
          tintColor={colors.onAccent}
          size={13}
        />
      ) : null}
      <Text
        variant={variant === 'rank' ? 'caption' : 'label'}
        tone={variant === 'score' ? 'score' : isSuccess ? undefined : 'default'}
        style={[
          variant === 'rank' && styles.rankText,
          isSuccess && { color: colors.onAccent, fontWeight: '600' },
          variant === 'score' && styles.tabular,
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
  },
  rankText: {
    fontWeight: '700',
    fontSize: 11,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
