import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { HouseholdProvider } from '@/contexts/HouseholdContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <HouseholdProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="household-setup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </HouseholdProvider>
    </AuthProvider>
  );
}