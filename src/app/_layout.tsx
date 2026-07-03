import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { initSyncListener } from '@/lib/sync';
import { useAppStore } from '@/lib/store';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { profiles, createProfile } = useAppStore();

  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync();

    // Start background sync listener exactly once on app mount
    initSyncListener();
  }, []);

  useEffect(() => {
    // Seed default profile if none exists
    if (profiles.length === 0) {
      createProfile({
        name: 'Geral',
        targetGoal: 'aesthetic',
        weightGoal: 68,
        proteinGoal: 140,
        caloriesGoal: 2200,
      });
    }
  }, [profiles, createProfile]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
