import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { ArrowLeft } from 'lucide-react-native';

export default function CreateHouseholdScreen() {
  const [name, setName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { refreshHouseholds } = useHousehold();

  const handleCreate = async () => {
    if (!name || !zipCode || !displayName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a household');
      return;
    }

    setLoading(true);

    try {
      // Create or update account profile
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let accountId;
      
      if (existingAccount) {
        // Update existing account
        const { data: updatedAccount, error: updateError } = await supabase
          .from('accounts')
          .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select('id')
          .single();

        if (updateError) throw updateError;
        accountId = updatedAccount.id;
      } else {
        // Create new account
        const { data: newAccount, error: insertError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            display_name: displayName,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        accountId = newAccount.id;
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          country,
          zip_code: zipCode,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Create membership as owner
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          account_id: accountId,
          household_id: household.id,
          role: 'owner',
        });

      if (membershipError) throw membershipError;

      // Add yourself as a member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          household_id: household.id,
          name: displayName,
          age_group: 'adult',
        });

      if (memberError) throw memberError;

      // Initialize donut status for all hazard types
      const hazardTypes = ['hurricane', 'wildfire', 'flood', 'earthquake', 'tornado', 'heat'];
      const donutStatusInserts = hazardTypes.map(hazard => ({
        household_id: household.id,
        hazard_type: hazard,
        readiness_percentage: 0,
      }));

      const { error: donutError } = await supabase
        .from('donut_status')
        .insert(donutStatusInserts);

      if (donutError) throw donutError;

      Alert.alert('Success', 'Household created successfully!', [
        {
          text: 'OK',
          onPress: async () => {
            await refreshHouseholds();
            router.replace('/(tabs)/dashboard');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error creating household:', error);
      Alert.alert('Error', error.message || 'Failed to create household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Household</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Display Name *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should others see your name?"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Household Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Smith Family"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Enter your ZIP code"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Country code"
              autoCapitalize="characters"
              maxLength={2}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Household'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  form: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});