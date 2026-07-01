import { StyleSheet, View, type ViewProps } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = ViewProps & {
  padded?: boolean;
  variant?: 'default' | 'flat' | 'stat';
  tone?: 'default' | 'muted' | 'inset';
  elevated?: boolean;
};

export function Card({
  style,
  padded = true,
  variant = 'default',
  tone = 'default',
  elevated = false,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing, elevation } = getTheme(colorScheme);

  const padding = !padded ? 0 : variant === 'stat' ? spacing.md : spacing.lg;

  const backgroundColor =
    tone === 'inset'
      ? colors.surfaceInset
      : tone === 'muted'
        ? colors.surfaceMuted
        : colors.surface;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: radius.lg,
          padding,
        },
        elevated ? elevation.subtle : null,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderCurve: 'continuous',
  },
});
