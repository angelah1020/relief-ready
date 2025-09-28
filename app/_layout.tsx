import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccountProvider } from '@/contexts/AccountContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';
import { MapProvider } from '@/contexts/MapContext';
import * as SplashScreen from 'expo-splash-screen';

export default function RootLayout() {
  const router = useRouter();
  useFrameworkReady();

  // Removed hardcoded redirect to login - let auth flow handle navigation
  useEffect(() => {
    // Force navigation test after 0.01 seconds
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <AccountProvider>
        <HouseholdProvider>
          <MapProvider>
            <Stack screenOptions={{ 
              headerShown: false,
              gestureEnabled: false, // Disable swipe back globally
            }}>
              <Stack.Screen 
                name="(tabs)" 
                options={{ 
                  headerShown: false,
                  gestureEnabled: false, // Disable swipe back for main tabs
                }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </MapProvider>
        </HouseholdProvider>
      </AccountProvider>
    </AuthProvider>
  );
}