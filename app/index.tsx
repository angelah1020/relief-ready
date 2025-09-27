import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { households, loading: householdLoading } = useHousehold();
  const [timeoutReached, setTimeoutReached] = useState(false);

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

  const handleManualLogin = () => {
    router.replace('/auth/login');
  };

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
    backgroundColor: '#f8fafc',
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});