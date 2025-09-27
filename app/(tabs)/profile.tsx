import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { colors } from '@/lib/theme';
import { supabase, Tables } from '@/lib/supabase';
import { 
  Home,
  Users,
  Plus,
  Settings,
  LogOut,
  Share,
  Check,
  X,
  Edit3,
  AlertCircle,
  ChevronDown,
} from 'lucide-react-native';

export default function HouseholdScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentHousehold, households, selectHousehold } = useHousehold();
  const [account, setAccount] = useState<Tables<'accounts'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Tables<'members'>[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Tables<'members'> | null>(null);
  const [memberForm, setMemberForm] = useState({
    firstName: '',
    lastName: '',
    ageGroup: 'adult' as 'infant' | 'child' | 'adult' | 'senior',
    medicalNotes: '',
    contactInfo: '',
    hasPet: false,
    petName: '',
    petType: '',
    petSize: 'medium' as 'small' | 'medium' | 'large',
    petNotes: '',
  });

  useEffect(() => {
    if (user) {
      fetchAccount();
    }
  }, [user]);

  useEffect(() => {
    if (currentHousehold) {
      fetchMembers();
    }
  }, [currentHousehold]);
  
  const fetchMembers = async () => {
    if (!currentHousehold) return;
    
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', currentHousehold.id);
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', 'Failed to fetch household members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAccount = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setAccount(data);
      }
    } catch (error) {
      console.error('Error fetching account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.replace('/auth/login');
            }
          },
        },
      ]
    );
  };

  const handleInviteMembers = () => {
    Alert.alert('Invite Members', 'Invite feature will be implemented soon.');
  };

  const handleCreateHousehold = () => {
    router.push('/household-setup/create');
  };

  const handleJoinHousehold = () => {
    router.push('/household-setup/join');
  };

  const handleSwitchHousehold = (householdId: string) => {
    selectHousehold(householdId);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Household</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Household</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.userCard}
          onPress={() => Alert.alert(
            'Edit Profile',
            'Update your profile information',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Display Name', onPress: () => {
                Alert.prompt(
                  'Update Display Name',
                  'Enter your new display name',
                  async (newName) => {
                    if (newName && user) {
                      try {
                        const { error } = await supabase
                          .from('accounts')
                          .update({ display_name: newName })
                          .eq('user_id', user.id);
                        
                        if (error) throw error;
                        fetchAccount();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to update display name');
                      }
                    }
                  }
                );
              }},
              { text: 'Photo', onPress: () => {
                Alert.alert('Coming Soon', 'Photo upload feature will be available soon');
              }}
            ]
          )}
        >
          <View style={styles.userAvatar}>
            <Users size={32} color="#6B7280" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{account?.display_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Household Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Management</Text>
        
        {/* Current & Switch Household */}
        <View style={styles.householdDropdown}>
          <TouchableOpacity
            style={[styles.householdCard, styles.currentHouseholdCard]}
            onPress={() => setShowHouseholdDropdown(!showHouseholdDropdown)}
          >
            <Home size={20} color="#354eab" />
            <View style={styles.householdInfo}>
              <Text style={styles.householdName}>
                {currentHousehold?.name || 'No Household Selected'}
              </Text>
              {currentHousehold && (
                <Text style={styles.householdLocation}>
                  {currentHousehold.zip_code}, {currentHousehold.country}
                </Text>
              )}
            </View>
            {households.length > 1 && (
              <ChevronDown 
                size={20} 
                color="#6B7280" 
                style={[
                  styles.dropdownIcon,
                  showHouseholdDropdown && styles.dropdownIconOpen
                ]} 
              />
            )}
          </TouchableOpacity>

          {/* Household Dropdown List */}
          {showHouseholdDropdown && households.length > 1 && (
            <View style={styles.dropdownList}>
              {households.map((household) => (
                <TouchableOpacity
                  key={household.id}
                  style={[
                    styles.dropdownItem,
                    currentHousehold?.id === household.id && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    handleSwitchHousehold(household.id);
                    setShowHouseholdDropdown(false);
                  }}
                >
                  <Home 
                    size={20} 
                    color={currentHousehold?.id === household.id ? colors.buttonSecondary : "#6B7280"} 
                  />
                  <View style={styles.householdInfo}>
                    <Text style={[
                      styles.householdName,
                      currentHousehold?.id === household.id && { color: colors.buttonSecondary }
                    ]}>
                      {household.name}
                    </Text>
                    <Text style={styles.householdLocation}>
                      {household.zip_code}, {household.country}
                    </Text>
                  </View>
                  {currentHousehold?.id === household.id && (
                    <Check size={20} color={colors.buttonSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Household Members */}
        {currentHousehold && (
          <View style={[styles.membersList, { marginTop: 12 }]}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersTitle}>Members</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setEditingMember(null);
                  setMemberForm({
                    firstName: '',
                    lastName: '',
                    ageGroup: 'adult',
                    medicalNotes: '',
                    contactInfo: '',
                    hasPet: false,
                    petName: '',
                    petType: '',
                    petSize: 'medium',
                    petNotes: '',
                  });
                  setShowMemberModal(true);
                }}
              >
                <Plus size={20} color="#354eab" />
              </TouchableOpacity>
            </View>
            {loadingMembers ? (
              <View style={styles.loadingMembersContainer}>
                <ActivityIndicator color={colors.buttonSecondary} />
              </View>
            ) : members.length === 0 ? (
              <View style={styles.emptyMembersContainer}>
                <AlertCircle size={24} color="#6B7280" />
                <Text style={styles.emptyMembersText}>No members added yet</Text>
              </View>
            ) : (
              <View>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <Users size={20} color="#6B7280" />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberAgeGroup}>
                        {member.age_group.charAt(0).toUpperCase() + member.age_group.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.memberActionButton}
                        onPress={() => {
                          const loadMemberData = async () => {
                            const nameParts = member.name.split(' ');
                            setEditingMember(member);

                            // Fetch associated pet if exists
                            const { data: pets } = await supabase
                              .from('pets')
                              .select('*')
                              .eq('household_id', currentHousehold?.id)
                              .limit(1);

                            const pet = pets?.[0];

                            setMemberForm({
                              firstName: nameParts[0] || '',
                              lastName: nameParts.slice(1).join(' '),
                              ageGroup: member.age_group,
                              medicalNotes: member.special_needs || '',
                              contactInfo: '',
                              hasPet: !!pet,
                              petName: pet?.name || '',
                              petType: pet?.type || '',
                              petSize: (pet?.size as 'small' | 'medium' | 'large') || 'medium',
                              petNotes: pet?.special_needs || '',
                            });
                            setShowMemberModal(true);
                          };
                          loadMemberData();
                        }}
                      >
                        <Edit3 size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.memberActionButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Member',
                            'Are you sure you want to remove this member?',
                            [
                              {
                                text: 'Cancel',
                                onPress: () => {},
                                isPreferred: true
                              },
                              {
                                text: 'Remove',
                                onPress: async () => {
                                  try {
                                    const { error } = await supabase
                                      .from('members')
                                      .delete()
                                      .eq('id', member.id);
                                    
                                    if (error) throw error;
                                    fetchMembers();
                                  } catch (error) {
                                    Alert.alert('Error', 'Failed to remove member');
                                  }
                                },
                              }
                            ]
                          );
                        }}
                      >
                        <X size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Household Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Actions</Text>
        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionItem} onPress={handleCreateHousehold}>
            <Plus size={20} color="#354eab" />
            <Text style={styles.actionText}>Create New Household</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleJoinHousehold}>
            <Users size={20} color="#354eab" />
            <Text style={styles.actionText}>Join Household</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleInviteMembers}>
            <Share size={20} color="#354eab" />
            <Text style={styles.actionText}>Invite Members</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Location section temporarily removed */}

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Options</Text>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={handleInviteMembers}>
            <Share size={20} color="#6B7280" />
            <Text style={styles.menuText}>Invite Members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Settings', 'Settings will be implemented soon.')}
          >
            <Settings size={20} color="#6B7280" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.signOutItem]} 
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#354eab" />
            <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Relief Ready</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Emergency preparedness made simple
          </Text>
        </View>
      </View>

      {/* Member Modal */}
      <Modal
        visible={showMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.memberModal, { maxHeight: '80%', borderRadius: 12 }]}>
          <View style={styles.memberModalHeader}>
            <Text style={styles.memberModalTitle}>
              {editingMember ? 'Edit Member' : 'Add Member'}
            </Text>
            <TouchableOpacity onPress={() => setShowMemberModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.memberForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name *</Text>
              <TextInput
                style={styles.formInput}
                value={memberForm.firstName}
                onChangeText={(text) => setMemberForm(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name *</Text>
              <TextInput
                style={styles.formInput}
                value={memberForm.lastName}
                onChangeText={(text) => setMemberForm(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Age Band *</Text>
              <View style={styles.formSelect}>
                {['infant', 'child', 'adult', 'senior'].map((age) => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.selectOption,
                      memberForm.ageGroup === age && styles.selectOptionSelected
                    ]}
                    onPress={() => setMemberForm(prev => ({ ...prev, ageGroup: age as typeof memberForm.ageGroup }))}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      memberForm.ageGroup === age && styles.selectOptionTextSelected
                    ]}>
                      {age.charAt(0).toUpperCase() + age.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Medical Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                value={memberForm.medicalNotes}
                onChangeText={(text) => setMemberForm(prev => ({ ...prev, medicalNotes: text }))}
                placeholder="Enter any medical conditions, allergies, or special needs"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Information</Text>
              <TextInput
                style={styles.formInput}
                value={memberForm.contactInfo}
                onChangeText={(text) => setMemberForm(prev => ({ ...prev, contactInfo: text }))}
                placeholder="Enter contact information"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.formLabel}>Has Pet?</Text>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  memberForm.hasPet && styles.selectOptionSelected
                ]}
                onPress={() => setMemberForm(prev => ({ ...prev, hasPet: !prev.hasPet }))}
              >
                <Text style={[
                  styles.selectOptionText,
                  memberForm.hasPet && styles.selectOptionTextSelected
                ]}>
                  {memberForm.hasPet ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            {memberForm.hasPet && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pet Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={memberForm.petName}
                    onChangeText={(text) => setMemberForm(prev => ({ ...prev, petName: text }))}
                    placeholder="Enter pet name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pet Type</Text>
                  <TextInput
                    style={styles.formInput}
                    value={memberForm.petType}
                    onChangeText={(text) => setMemberForm(prev => ({ ...prev, petType: text }))}
                    placeholder="Enter pet type (e.g., Dog, Cat)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pet Size</Text>
                  <View style={styles.formSelect}>
                    {['small', 'medium', 'large'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.selectOption,
                          memberForm.petSize === size && styles.selectOptionSelected
                        ]}
                        onPress={() => setMemberForm(prev => ({ ...prev, petSize: size as typeof memberForm.petSize }))}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          memberForm.petSize === size && styles.selectOptionTextSelected
                        ]}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Pet Notes</Text>
                  <TextInput
                    style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                    value={memberForm.petNotes}
                    onChangeText={(text) => setMemberForm(prev => ({ ...prev, petNotes: text }))}
                    placeholder="Enter any special needs or notes about the pet"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, (!memberForm.firstName || !memberForm.lastName) && styles.submitButtonDisabled]}
              onPress={async () => {
                if (!currentHousehold) return;

                if (!memberForm.firstName.trim()) {
                  Alert.alert('Error', 'First name is required');
                  return;
                }

                if (!memberForm.lastName.trim()) {
                  Alert.alert('Error', 'Last name is required');
                  return;
                }

                try {
                  const memberData = {
                    household_id: currentHousehold.id,
                    name: `${memberForm.firstName} ${memberForm.lastName}`.trim(),
                    age_group: memberForm.ageGroup,
                    special_needs: memberForm.medicalNotes,
                    contact_info: memberForm.contactInfo,
                  };

                  if (editingMember) {
                    // Update existing member
                    const { error: memberError } = await supabase
                      .from('members')
                      .update(memberData)
                      .eq('id', editingMember.id);

                    if (memberError) throw memberError;
                  } else {
                    // Create new member
                    const { error: memberError } = await supabase
                      .from('members')
                      .insert(memberData);

                    if (memberError) throw memberError;
                  }

                  // Handle pet data if member has a pet
                  if (memberForm.hasPet && memberForm.petName && memberForm.petType) {
                    const petData = {
                      household_id: currentHousehold.id,
                      name: memberForm.petName,
                      type: memberForm.petType,
                      size: memberForm.petSize,
                      special_needs: memberForm.petNotes,
                    };

                    const { error: petError } = await supabase
                      .from('pets')
                      .insert(petData);

                    if (petError) throw petError;
                  }

                  await fetchMembers();
                  setShowMemberModal(false);
                } catch (error) {
                  console.error('Error saving member:', error);
                  Alert.alert('Error', 'Failed to save member information');
                }
              }}
            >
              <Text style={styles.submitButtonText}>Save Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMemberModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  householdDropdown: {
    position: 'relative',
    marginBottom: 12,
  },
  dropdownIcon: {
    marginLeft: 'auto',
  },
  dropdownIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedDropdownItem: {
    backgroundColor: colors.buttonSecondary + '12',
  },
  memberModal: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxHeight: '90%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  memberForm: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  formSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectOptionSelected: {
    backgroundColor: colors.buttonSecondary,
    borderColor: colors.buttonSecondary,
  },
  selectOptionText: {
    color: '#374151',
    fontSize: 14,
  },
  selectOptionTextSelected: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMembersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyMembersContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emptyMembersText: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  memberAgeGroup: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
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
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  householdCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentHouseholdCard: {
    borderColor: '#354eab',
    borderWidth: 2,
  },
  householdList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  householdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedHousehold: {
    backgroundColor: colors.buttonSecondary + '22',
  },
  householdInfo: {
    marginLeft: 12,
    flex: 1,
  },
  householdName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  selectedHouseholdText: {
    color: '#354eab',
  },
  householdLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchText: {
    fontSize: 14,
    color: '#354eab',
    marginLeft: 12,
  },
  membersList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  menuList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  signOutItem: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#354eab',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Location styles
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  meetingPointContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  meetingPointLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  meetingPointButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  meetingPointText: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Plan styles
  planList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  planInfo: {
    flex: 1,
    marginRight: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  planDetail: {
    fontSize: 14,
    color: '#6b7280',
  },
});