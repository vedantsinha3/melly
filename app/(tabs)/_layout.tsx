import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppSidebar } from '@/components/navigation/AppSidebar';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const { signOut } = useAuth();
  const isWide = width >= layout.breakpointWide;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <AppSidebar onSignOut={handleSignOut} />
      <View style={styles.main}>
        <Tabs
          tabBar={isWide ? () => null : undefined}
          screenOptions={{
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.separator,
              borderTopWidth: StyleSheet.hairlineWidth,
              paddingTop: 6,
              height: 72,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            headerShown: true,
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTitleStyle: {
              color: colors.text,
              fontWeight: '600',
              fontSize: 17,
            },
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'square.grid.2x2.fill', android: 'dashboard', web: 'dashboard' }}
                  tintColor={color}
                  size={22}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: 'Log song',
              headerShown: !isWide,
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                  tintColor={color}
                  size={22}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
});
