import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  title?: string;
};

export function DetailTopBar({ title }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View
      style={[
        styles.bar,
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderBottomColor: colors.separator,
        },
      ]}>
      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed, hovered }) => [
          styles.backButton,
          {
            borderRadius: radius.md,
            backgroundColor: pressed || hovered ? colors.surfaceHover : 'transparent',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            transitionDuration: `${motion.fast}ms`,
          },
        ]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          tintColor={colors.text}
          size={18}
        />
        <Text variant="label">Back</Text>
      </Pressable>

      {title ? (
        <Text variant="label" tone="secondary" numberOfLines={1} style={[styles.title, { textAlign: 'center' }]}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: Platform.OS === 'web' ? 48 : 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
});
