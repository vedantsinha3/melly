import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppSidebar } from '@/components/navigation/AppSidebar';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
  const { width } = useWindowDimensions();
  const { requestSignOut } = useAuth();
  const isWide = width >= layout.breakpointWide;

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <AppSidebar onSignOut={requestSignOut} />
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
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                  tintColor={color}
                  size={22}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="library"
            options={{
              title: 'Library',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'music.note.list', android: 'library_music', web: 'library_music' }}
                  tintColor={color}
                  size={22}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="albums"
            options={{
              title: 'Albums',
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <SymbolView
                  name={{ ios: 'square.stack.fill', android: 'album', web: 'album' }}
                  tintColor={color}
                  size={22}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="import"
            options={{
              title: 'Quick start',
              href: null,
              headerShown: false,
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
