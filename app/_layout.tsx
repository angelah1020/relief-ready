import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  // console.log('RootLayout - Rendered');
  const router = useRouter();
  useFrameworkReady();

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <AuthProvider>
      <HouseholdProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </HouseholdProvider>
    </AuthProvider>
  );
}