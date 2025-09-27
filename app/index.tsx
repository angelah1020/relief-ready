import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import SplashScreen from '@/components/SplashScreen';
import { colors } from '@/lib/theme';
import * as ExpoSplash from 'expo-splash-screen';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { households, loading: householdLoading } = useHousehold();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Do not navigate while the splash animation is still showing.
    if (showSplash) return;

    // If there's no signed-in user, go straight to login as soon as splash completes.
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // If user exists, wait for household/auth to finish loading before routing to dashboard.
    if (authLoading || householdLoading) {
      return;
    }

    router.replace('/(tabs)/dashboard');
  }, [user, households, authLoading, householdLoading, showSplash]);

  const handleSplashComplete = async () => {
    // Hide the native splash once our custom animation is done to avoid a flicker
    try {
      await ExpoSplash.hideAsync();
    } catch (err) {
      // ignore
    }
    setShowSplash(false);
  };

  const handleManualLogin = () => {
    router.replace('/auth/login');
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }
  // While the app finishes routing after splash, render nothing (navigation will take user
  // to login or dashboard). This avoids showing an intermediate 'taking too long' screen.
  return <></>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: colors.lightBlue,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.buttonPrimary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});