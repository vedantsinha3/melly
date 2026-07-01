import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type Props = {
  message?: string;
};

export function LoadingState({ message }: Props) {
  const colorScheme = useColorScheme();
  const { colors, spacing } = getTheme(colorScheme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, gap: spacing.sm }]}>
      <ActivityIndicator color={colors.tint} />
      {message ? (
        <Text variant="bodySmall" tone="secondary">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
