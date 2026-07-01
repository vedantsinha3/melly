import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export function TextField({ style, placeholderTextColor, ...props }: TextInputProps) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing, typography } = getTheme(colorScheme);

  return (
    <TextInput
      style={[
        styles.input,
        typography.body,
        {
          color: colors.text,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
        style,
      ]}
      placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderCurve: 'continuous',
  },
});
