import { StyleSheet, View, type ViewProps } from 'react-native';

import { Text } from './Text';

type Props = ViewProps & {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, rightElement, style, ...props }: Props) {
  return (
    <View style={[styles.row, style]} {...props}>
      <View style={styles.left}>
        <Text variant="title">{title}</Text>
        {subtitle ? <Text variant="bodySmall" tone="secondary">{subtitle}</Text> : null}
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
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 4,
  },
});
