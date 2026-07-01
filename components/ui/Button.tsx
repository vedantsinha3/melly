import { ActivityIndicator, Platform, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md';

type Props = Omit<PressableProps, 'style'> & {
  title: string;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: PressableProps['style'];
};

export function Button({
  title,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  style,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing, elevation, motion } = getTheme(colorScheme);
  const isDisabled = Boolean(disabled || loading);
  const isSolid = variant === 'primary' || variant === 'destructive';
  const isCompact = size === 'sm';

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => {
        const { pressed, hovered } = state;
        const userStyle = typeof style === 'function' ? style(state) : style;
        const isWebHover = Platform.OS === 'web' && hovered && !isDisabled;

        return [
          styles.base,
          {
            borderRadius: radius.md,
            minHeight: isCompact ? 34 : 42,
            paddingVertical: isCompact ? 7 : 11,
            paddingHorizontal: isCompact ? spacing.md : spacing.lg,
            opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
            backgroundColor:
              variant === 'primary'
                ? colors.accent
                : variant === 'destructive'
                  ? colors.error
                  : variant === 'secondary'
                    ? colors.surfaceMuted
                    : 'transparent',
            borderWidth: 0,
            ...(isWebHover && variant === 'primary'
              ? {
                  backgroundColor: '#148B3E',
                  transform: [{ translateY: -1 }],
                  boxShadow: `0 4px 14px ${colors.shadowStrong}`,
                }
              : null),
            ...(isWebHover && variant === 'secondary'
              ? { backgroundColor: colors.surfaceHover }
              : null),
            ...(isWebHover && variant === 'ghost' ? { backgroundColor: colors.surfaceMuted } : null),
            transitionDuration: `${motion.normal}ms`,
          },
          variant === 'primary' ? elevation.subtle : null,
          userStyle,
        ];
      }}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isSolid ? '#fff' : colors.accent} />
      ) : (
        <Text
          variant="label"
          style={[
            styles.label,
            {
              color: isSolid ? '#fff' : variant === 'ghost' ? colors.textSecondary : colors.text,
              fontSize: isCompact ? 12 : 13,
              fontWeight: isSolid ? '600' : '500',
              letterSpacing: isSolid ? 0.1 : 0,
            },
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
