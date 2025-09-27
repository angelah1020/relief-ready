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

type Member = {
  id: string;
  name: string;
  claimed_by: string | null;
};

export default function JoinHouseholdScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [unclaimedMembers, setUnclaimedMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();
  const { refreshHouseholds } = useHousehold();

  const handleValidateCode = async () => {
    if (!joinCode) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    setLoading(true);

    try {
      // Find household by join code
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id')
        .eq('join_code', joinCode.trim().toUpperCase())
        .single();

      if (householdError || !household) {
        Alert.alert('Error', 'Invalid join code');
        setLoading(false);
        return;
      }

      // Get unclaimed members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name, claimed_by')
        .eq('household_id', household.id)
        .is('claimed_by', null);

      if (membersError) throw membersError;

      setUnclaimedMembers(members || []);
      setShowMemberList(true);
    } catch (error: any) {
      console.error('Error validating join code:', error);
      Alert.alert('Error', error.message || 'Failed to validate join code');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode) {
      Alert.alert('Error', 'Please enter a join code');
      return;
    }

    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select an existing member profile to claim');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a household');
      return;
    }

    setLoading(true);

    try {
      // Get household by join code
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('id')
        .eq('join_code', joinCode.trim().toUpperCase())
        .single();

      if (householdError || !household) {
        Alert.alert('Error', 'Invalid join code');
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
        accountId = existingAccount.id;
      } else {
        // Create new account
        const { data: newAccount, error: insertError } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.first_name || user.email || 'User',
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
          household_id: household.id,
          role: 'member',
        });

      if (membershipError) throw membershipError;

      // Claim the selected member
      const { error: claimError } = await supabase
        .from('members')
        .update({
          claimed_by: user.id,
        })
        .eq('id', selectedMemberId);

      if (claimError) throw claimError;

      // Regenerate all checklists since household composition changed
      try {
        const { generateAllChecklists } = await import('@/lib/checklist');
        await generateAllChecklists(household.id);
        console.log('Checklists regenerated after member join');
      } catch (checklistError) {
        console.error('Failed to regenerate checklists:', checklistError);
        // Don't fail the join process if checklist generation fails
      }

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

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {!showMemberList ? (
            // Step 1: Enter and validate code
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Household Code</Text>
                <TextInput
                  style={styles.input}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Enter 6-character code"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                />
                <Text style={styles.helperText}>
                  Ask a household member for their household code
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleValidateCode}
                disabled={loading || !joinCode}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Checking...' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Step 2: Select profile
            <>
              {unclaimedMembers.length > 0 ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Your Profile</Text>
                    <Text style={styles.helperText}>
                      Select your name below to claim your profile
                    </Text>
                    {unclaimedMembers.map((member) => (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.memberItem,
                          selectedMemberId === member.id && styles.memberItemSelected
                        ]}
                        onPress={() => {
                          setSelectedMemberId(member.id);
                        }}
                      >
                        <Text style={[
                          styles.memberItemText,
                          selectedMemberId === member.id && styles.memberItemTextSelected
                        ]}>
                          {member.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleJoin}
                    disabled={loading || !selectedMemberId}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Joining...' : 'Join Household'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>No Available Profiles</Text>
                  <Text style={styles.helperText}>
                    There are no unclaimed member profiles in this household. Please contact the household owner to add your profile.
                  </Text>
                </View>
              )}
            </>
          )}
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
    paddingTop: 20,
    paddingBottom: 40,
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
  memberItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  memberItemSelected: {
    borderColor: '#354eab',
    backgroundColor: '#eef2ff',
  },
  memberItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  memberItemTextSelected: {
    color: '#354eab',
    fontWeight: '600',
  },
});