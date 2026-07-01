import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  contentStyle?: ViewStyle;
  /** Use full width with minimal horizontal padding (dashboard-style layouts). */
  edgeToEdge?: boolean;
  /** Wider max-width for dashboard grids. */
  wide?: boolean;
};

export function Screen({
  children,
  scroll,
  keyboardAvoiding,
  contentStyle,
  edgeToEdge,
  wide,
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, layout, spacing } = getTheme(colorScheme);

  const shellStyle = [
    styles.content,
    edgeToEdge
      ? {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          maxWidth: wide ? layout.maxContentWidth : undefined,
          alignSelf: wide ? ('center' as const) : undefined,
          width: wide ? ('100%' as const) : undefined,
        }
      : { maxWidth: layout.maxContentWidth, padding: layout.screenPadding },
  ];

  const inner = scroll ? (
    <ScrollView contentContainerStyle={[shellStyle, contentStyle]}>{children}</ScrollView>
  ) : (
    <View style={[shellStyle, contentStyle]}>{children}</View>
  );

  if (keyboardAvoiding) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {inner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
