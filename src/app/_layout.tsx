import { useEffect } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { initSyncListener } from '@/lib/sync';
import { useAppStore } from '@/lib/store';
import tw from 'twrnc';
import { MaterialIcons } from '@expo/vector-icons';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { 
    profiles, 
    createProfile,
    toast,
    hideToast 
  } = useAppStore();

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

  // Auto hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <View style={tw`flex-1`}>
        {/* Floating Toast Notification Overlay */}
        {toast && (
          <View 
            style={tw`absolute top-14 left-4 right-4 z-50 p-3.5 rounded-2xl flex-row items-center shadow-lg border ${
              toast.type === 'success'
                ? (isDark ? 'bg-emerald-950/90 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                : toast.type === 'error'
                ? (isDark ? 'bg-red-950/90 border-red-500/20' : 'bg-red-50 border-red-200')
                : (isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200')
            }`}
          >
            <View style={tw`w-8 h-8 rounded-full items-center justify-center mr-3 ${
              toast.type === 'success' ? 'bg-emerald-500/10' : toast.type === 'error' ? 'bg-red-500/10' : 'bg-blue-500/10'
            }`}>
              <MaterialIcons 
                name={toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'error' : 'info'} 
                size={18} 
                color={toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6'} 
              />
            </View>
            <Text style={tw`text-xs font-bold flex-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {toast.message}
            </Text>
            <TouchableOpacity onPress={hideToast} style={tw`p-1`}>
              <MaterialIcons name="close" size={16} color={isDark ? '#9CA3AF' : '#4B5563'} />
            </TouchableOpacity>
          </View>
        )}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
