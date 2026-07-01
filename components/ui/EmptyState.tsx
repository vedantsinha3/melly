import { StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  mark?: string;
  title: string;
  subtitle: string;
  ctaTitle?: string;
  onPressCta?: () => void;
  secondaryTitle?: string;
  onPressSecondary?: () => void;
};

export function EmptyState({
  mark = '1',
  title,
  subtitle,
  ctaTitle,
  onPressCta,
  secondaryTitle,
  onPressSecondary,
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, spacing, radius } = getTheme(colorScheme);

  return (
    <View
      style={[
        styles.container,
        {
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          boxShadow: `0 12px 26px ${colors.shadow}`,
        },
      ]}>
      <View style={[styles.mark, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
        <Text variant="title" tone="accent" style={styles.markText}>
          {mark}
        </Text>
      </View>
      <Text variant="title" style={styles.center}>
        {title}
      </Text>
      <Text variant="body" tone="secondary" style={styles.center}>
        {subtitle}
      </Text>
      {ctaTitle && onPressCta ? <Button title={ctaTitle} onPress={onPressCta} /> : null}
      {secondaryTitle && onPressSecondary ? (
        <Button title={secondaryTitle} variant="secondary" onPress={onPressSecondary} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderCurve: 'continuous',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  mark: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontVariant: ['tabular-nums'],
  },
  center: {
    textAlign: 'center',
    maxWidth: 340,
  },
});
