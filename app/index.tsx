import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { households, loading: householdLoading } = useHousehold();

  useEffect(() => {
    if (authLoading || householdLoading) return;

    if (!user) {
      router.replace('/auth/login');
    } else if (households.length === 0) {
      router.replace('/household-setup');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, households, authLoading, householdLoading]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Relief Ready</Text>
      <Text style={styles.subtext}>Loading...</Text>
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
  },
});