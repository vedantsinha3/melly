import { StyleSheet, View, type ViewProps } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type Props = ViewProps & {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, rightElement, style, ...props }: Props) {
  const colorScheme = useColorScheme();
  const { spacing } = getTheme(colorScheme);

  return (
    <View style={[styles.row, { gap: spacing.md }, style]} {...props}>
      <View style={[styles.left, { gap: spacing.xs }]}>
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  left: {
    flex: 1,
  },
});
