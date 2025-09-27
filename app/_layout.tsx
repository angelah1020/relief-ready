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
    // console.log('RootLayout - useEffect called');
    SplashScreen.hideAsync().catch(() => {
      console.log('RootLayout - Error hiding splash screen');
    });

    // Force navigation test after 1 seconds
    const timer = setTimeout(() => {
      // console.log('RootLayout - Force navigation to login');
      router.replace('/auth/login');
    }, 1000);

    return () => clearTimeout(timer);
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