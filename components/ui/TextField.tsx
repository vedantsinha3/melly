import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = TextInputProps & {
  label?: string;
};

export function TextField({ label, style, placeholderTextColor, onFocus, onBlur, ...props }: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing, typography, motion } = getTheme(colorScheme);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label ? (
        <Text variant="caption" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          typography.body,
          {
            color: colors.text,
            borderColor: focused ? colors.accent : colors.border,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            ...(focused
              ? {
                  boxShadow: `0 0 0 3px ${colors.accentSoft}`,
                  transitionDuration: `${motion.fast}ms`,
                }
              : null),
          },
          style,
        ]}
        placeholderTextColor={placeholderTextColor ?? colors.textSecondary}
        accessibilityLabel={label ?? props.placeholder}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderCurve: 'continuous',
  },
});
