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

  // Let the index screen handle navigation after splash screen

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