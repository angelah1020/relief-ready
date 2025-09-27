import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Home, Users } from 'lucide-react-native';

export default function HouseholdSetupScreen() {
  const router = useRouter();

  const handleCreateHousehold = () => {
    router.push('/household-setup/create');
  };

  const handleJoinHousehold = () => {
    router.push('/household-setup/join');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Setup Your Household</Text>
          <Text style={styles.subtitle}>
            Create a new household or join an existing one to start building your emergency preparedness plan.
          </Text>
        </View>

        <View style={styles.options}>
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleCreateHousehold}
          >
            <Home size={48} color="#DC2626" />
            <Text style={styles.optionTitle}>Create Household</Text>
            <Text style={styles.optionDescription}>
              Start a new household and invite family members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleJoinHousehold}
          >
            <Users size={48} color="#059669" />
            <Text style={styles.optionTitle}>Join Household</Text>
            <Text style={styles.optionDescription}>
              Use an invite code to join an existing household
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  options: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});