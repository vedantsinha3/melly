import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTheme, layout, spacing as themeSpacing } from '@/constants/theme';
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
  /** Skip SafeAreaView when an outer shell already handles insets. */
  omitSafeArea?: boolean;
};

/** Centered max-width container for scroll content inside a full-width ScrollView. */
export function wideScrollContentStyle(): ViewStyle {
  return {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: themeSpacing.lg,
    paddingTop: themeSpacing.sm,
  };
}

export function Screen({
  children,
  scroll,
  keyboardAvoiding,
  contentStyle,
  edgeToEdge,
  wide,
  omitSafeArea,
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, layout: layoutTokens, spacing } = getTheme(colorScheme);

  const wideContent = wide && edgeToEdge ? wideScrollContentStyle() : null;

  const shellStyle = [
    styles.content,
    edgeToEdge
      ? wide
        ? styles.fullWidthShell
        : {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
          }
      : { maxWidth: layoutTokens.maxContentWidth, padding: layoutTokens.screenPadding },
  ];

  const inner = scroll ? (
    <ScrollView
      style={wide && edgeToEdge ? styles.fullWidthScroll : undefined}
      contentContainerStyle={[wideContent ?? shellStyle, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[shellStyle, contentStyle]}>{children}</View>
  );

  if (omitSafeArea) {
    if (keyboardAvoiding) {
      return (
        <KeyboardAvoidingView
          style={[styles.flex, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {inner}
        </KeyboardAvoidingView>
      );
    }
    return <View style={[styles.flex, { backgroundColor: colors.background }]}>{inner}</View>;
  }

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
  fullWidthScroll: {
    flex: 1,
    width: '100%',
  },
  fullWidthShell: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
