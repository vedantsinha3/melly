import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ImportQueueProvider } from '@/contexts/ImportQueueContext';
import { Colors, getTheme } from '@/constants/theme';
import { isOnboardingCompleted } from '@/lib/profile';
import { fetchRankedRatings } from '@/lib/ranking';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  return children;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, session, loading, isSpotifyUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkOnboarding() {
      if (loading || !user || !session) {
        setChecking(false);
        return;
      }

      const rootSegment = segments[0] as string | undefined;
      const inAuth = rootSegment === '(auth)';
      const inOnboarding = rootSegment === 'onboarding';
      const inCompare = rootSegment === 'compare';
      const inArtist = rootSegment === 'artist';
      const inAlbum = rootSegment === 'album';
      const inSong = rootSegment === 'song';
      const inTabbedImport = rootSegment === '(tabs)' && segments[1] === 'import';

      if (inAuth || inOnboarding || inCompare || inArtist || inAlbum || inSong || inTabbedImport) {
        setChecking(false);
        return;
      }

      try {
        const completed = await isOnboardingCompleted(user.id);
        if (completed || !isSpotifyUser) {
          setChecking(false);
          return;
        }

        const ratings = await fetchRankedRatings(user.id);
        if (ratings.length === 0) {
          router.replace('/(tabs)/import');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    }

    checkOnboarding();
  }, [user, session, loading, isSpotifyUser, segments, router]);

  if (checking) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ImportQueueProvider>
        <RootLayoutNav />
      </ImportQueueProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : LightTheme}>
      <AuthGate>
        <OnboardingGate>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen
              name="album/[albumName]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="artist/[artistName]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="compare/[trackId]"
              options={{
                title: 'Rank this song',
                presentation: 'modal',
                headerLargeTitle: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '600', fontSize: 17 },
              }}
            />
            <Stack.Screen
              name="song/[ratingId]"
              options={{ headerShown: false }}
            />
          </Stack>
        </OnboardingGate>
      </AuthGate>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
