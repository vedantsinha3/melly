import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppSidebar } from '@/components/navigation/AppSidebar';
import { DetailTopBar } from '@/components/navigation/DetailTopBar';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export function DetailShell({ children, title }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const { requestSignOut } = useAuth();
  const isWide = width >= layout.breakpointWide;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.row}>
        {isWide ? <AppSidebar onSignOut={requestSignOut} /> : null}
        <View style={styles.main}>
          <DetailTopBar title={title} />
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    flex: 1,
  },
});
