import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Your Rankings',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'list.number', android: 'list', web: 'list' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Log Song',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
