import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import SplashScreen from '@/components/SplashScreen';
import { colors } from '@/lib/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { households, loading: householdLoading } = useHousehold();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeoutReached(true);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ((authLoading || householdLoading) && !timeoutReached) {
      return;
    }

    if (!user) {
      router.replace('/auth/login');
    } else if (households.length === 0) {
      router.replace('/household-setup');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, households, authLoading, householdLoading]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleManualLogin = () => {
    router.replace('/auth/login');
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Relief Ready</Text>
      <Text style={styles.subtext}>
        {timeoutReached ? 'Taking too long to load...' : 'Loading...'}
      </Text>
      {timeoutReached && (
        <TouchableOpacity style={styles.button} onPress={handleManualLogin}>
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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