import { Platform, Pressable, StyleSheet } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function Chip({ label, active = false, onPress }: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, spacing, motion } = getTheme(colorScheme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
          borderColor: active ? colors.accentMuted : 'transparent',
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs + 2,
          opacity: pressed ? 0.85 : 1,
          ...(Platform.OS === 'web' && hovered && !active
            ? { backgroundColor: colors.surfaceHover }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      <Text variant="caption" tone={active ? 'accent' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderCurve: 'continuous',
  },
});
