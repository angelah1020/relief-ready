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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { ArrowLeft } from 'lucide-react-native';

export default function JoinHouseholdScreen() {
  const [inviteToken, setInviteToken] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { refreshHouseholds } = useHousehold();

  const handleJoin = async () => {
    if (!inviteToken || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a household');
      return;
    }

    setLoading(true);

    try {
      // Validate invite token
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', inviteToken.trim().toUpperCase())
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (inviteError || !invite) {
        Alert.alert('Error', 'Invalid or expired invite code');
        setLoading(false);
        return;
      }

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

      // Create membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          account_id: accountId,
          household_id: invite.household_id,
          role: 'member',
        });

      if (membershipError) throw membershipError;

      // Add as member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          household_id: invite.household_id,
          name: displayName,
          age_group: 'adult',
        });

      if (memberError) throw memberError;

      // Regenerate all checklists since household composition changed
      try {
        const { generateAllChecklists } = await import('@/lib/checklist');
        await generateAllChecklists(invite.household_id);
        console.log('Checklists regenerated after member join');
      } catch (checklistError) {
        console.error('Failed to regenerate checklists:', checklistError);
        // Don't fail the join process if checklist generation fails
      }

      // Mark invite as used
      const { error: useError } = await supabase
        .from('invites')
        .update({
          used_by: accountId,
          used_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (useError) throw useError;

      Alert.alert('Success', 'Successfully joined household!', [
        {
          text: 'OK',
          onPress: async () => {
            await refreshHouseholds();
            router.replace('/(tabs)/dashboard');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error joining household:', error);
      Alert.alert('Error', error.message || 'Failed to join household');
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
        <Text style={styles.headerTitle}>Join Household</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should others see your name?"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Invite Code</Text>
            <TextInput
              style={styles.input}
              value={inviteToken}
              onChangeText={setInviteToken}
              placeholder="Enter the invite code"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Ask a household member for the invite code
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Joining...' : 'Join Household'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#354eab',
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