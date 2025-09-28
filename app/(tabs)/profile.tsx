import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Share as ShareAPI,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import DisasterMap from '@/components/maps/DisasterMap';
import { colors } from '@/lib/theme';
import { supabase, Tables } from '@/lib/supabase';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { pdfExportService, HouseholdData, InventoryData, ChecklistData, MapData } from '@/services/pdf-export';
import { captureRef } from 'react-native-view-shot';
import { generateAllChecklists } from '@/lib/checklist';
import * as ImagePicker from 'expo-image-picker';
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
  UserMinus,
  FileText,
  Camera,
} from 'lucide-react-native';

const PET_TYPES = [
  'Dog',
  'Cat',
  'Bird',
  'Fish',
  'Rabbit',
  'Hamster',
  'Guinea Pig',
  'Reptile',
  'Other',
];

export default function HouseholdScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentHousehold, households, selectHousehold, refreshHouseholds } = useHousehold();
  const [account, setAccount] = useState<Tables<'accounts'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Tables<'members'>[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Tables<'members'> | null>(null);
  const [editingPet, setEditingPet] = useState<Tables<'pets'> | null>(null);
  const [memberForm, setMemberForm] = useState({
    firstName: '',
    lastName: '',
    ageGroup: 'adult' as 'infant' | 'child' | 'teen' | 'adult' | 'senior',
    medicalNotes: '',
    contactInfo: '',
  });
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'Dog',
    size: 'medium' as 'small' | 'medium' | 'large',
    medicalNotes: '',
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pets, setPets] = useState<Tables<'pets'>[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const mapRef = useRef<View>(null);

  useEffect(() => {
    if (user) {
      fetchAccount();
    }
  }, [user]);

  useEffect(() => {
    if (currentHousehold) {
      fetchMembers();
      fetchPets();
    }
  }, [currentHousehold]);
  
  const fetchMembers = async () => {
    if (!currentHousehold || !user) return;
    
    setLoadingMembers(true);
    try {
      // First get members
      const { data: membersData, error } = await supabase
        .from('members')
        .select('*')
        .eq('household_id', currentHousehold.id);
      
      if (error) throw error;
      
      // Then get account info for claimed members
      const membersWithAccounts = await Promise.all(
        (membersData || []).map(async (member) => {
          if (member.claimed_by) {
            const { data: account } = await supabase
              .from('accounts')
              .select('id, display_name, user_id, photo_url')
              .eq('user_id', member.claimed_by)
              .single();
            
            
            return { ...member, account, isCurrentUser: member.claimed_by === user?.id };
          }
          return member;
        })
      );
      
      setMembers(membersWithAccounts);
    } catch (error) {
      // Error fetching members
      Alert.alert('Error', 'Failed to fetch household members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchPets = async () => {
    if (!currentHousehold) return;
    
    setLoadingPets(true);
    try {
      const { data: petsData, error } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', currentHousehold.id);
      
      if (error) throw error;
      setPets(petsData || []);
    } catch (error) {
      // Error fetching pets
      Alert.alert('Error', 'Failed to fetch household pets');
    } finally {
      setLoadingPets(false);
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
        setProfilePhoto(data.photo_url);
      }
    } catch (error) {
      // Error fetching account
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }


      // Show action sheet
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a profile photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Take Photo', 
            onPress: () => takePhoto() 
          },
          { 
            text: 'Choose from Library', 
            onPress: () => pickImage() 
          },
          ...(profilePhoto ? [{ 
            text: 'Remove Photo', 
            style: 'destructive' as const,
            onPress: () => removePhoto() 
          }] : [])
        ]
      );
    } catch (error) {
      // Error requesting permissions
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      // Error taking photo
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      // Error picking image
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    try {
      setIsUploadingPhoto(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ photo_url: base64 })
            .eq('user_id', user?.id);

          if (updateError) throw updateError;

          setProfilePhoto(base64);
          fetchMembers();
          Alert.alert('Success', 'Profile photo updated successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to upload photo');
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Error', 'Failed to process photo');
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ photo_url: null })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfilePhoto(null);
      // Refresh members to show updated profile photo
      fetchMembers();
      Alert.alert('Success', 'Profile photo removed successfully!');
    } catch (error) {
      // Error removing photo
      Alert.alert('Error', 'Failed to remove photo');
    }
  };

  const handleExportPDF = async () => {
    if (!currentHousehold) {
      Alert.alert('Error', 'No household selected');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Fetch all necessary data
      const [inventoryData, checklistData, petsData] = await Promise.all([
        fetchInventoryData(),
        fetchChecklistData(),
        fetchPetsData()
      ]);

      // Debug: Log data being sent to PDF

      // Prepare household data
      const householdData: HouseholdData = {
        name: currentHousehold.name,
        country: currentHousehold.country,
        postalCode: currentHousehold.zip_code,
        memberCount: members.length,
        petCount: petsData.length,
        riskProfile: (currentHousehold as any).risk_profile || [],
        members: members.map(member => ({
          firstName: member.name.split(' ')[0] || '',
          lastName: member.name.split(' ').slice(1).join(' ') || '',
          ageBand: member.age_group,
          medicalNote: member.medical_notes || undefined,
          hasAccount: false // This would need to be determined from memberships table
        })),
        pets: petsData.map(pet => ({
          type: pet.type,
          count: 1, // Assuming 1 pet per record
          note: pet.special_needs || undefined
        })),
        rallyPoint: (currentHousehold as any).rally_point || undefined,
        outOfAreaContact: (currentHousehold as any).out_of_area_contact ? {
          name: (currentHousehold as any).out_of_area_contact,
          phone: (currentHousehold as any).out_of_area_phone || ''
        } : undefined,
        iceContacts: [] // This would need to be fetched from a separate table
      };

      // Capture map screenshot
      let mapImageUri: string | undefined;
      try {
        if (mapRef.current && currentHousehold?.zip_code && currentHousehold.latitude && currentHousehold.longitude) {
          
          // Add delay to ensure map renders completely
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          mapImageUri = await captureRef(mapRef.current, {
            format: 'png',
            quality: 0.8,
            result: 'base64',
          });
        } else {
          // Map not available for screenshot
        }
      } catch (error) {
        // Error capturing map screenshot
        // Continue without map image
      }

      // Prepare map data
      const mapData: MapData = {
        center: {
          latitude: currentHousehold.latitude || 0,
          longitude: currentHousehold.longitude || 0
        },
        activeAlerts: [], // This would need to be fetched from the map context
        nearbyResources: [], // This would need to be fetched from the map context
        mapImageUri
      };

      // Generate PDF
      const pdfUri = await pdfExportService.generatePDF(
        householdData,
        inventoryData,
        checklistData,
        mapData
      );

      // Share PDF
      await pdfExportService.sharePDF(pdfUri);

    } catch (error) {
      // Error generating PDF
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const fetchInventoryData = async (): Promise<InventoryData[]> => {
    if (!currentHousehold) return [];

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('household_id', currentHousehold.id);

      if (error) throw error;

      // Group items by category
      const categorizedItems = (data || []).reduce((acc, item) => {
        const category = item.canonical_key || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          aiConfidence: item.ai_confidence
        });
        return acc;
      }, {} as Record<string, any[]>);

      return Object.entries(categorizedItems).map(([category, items]) => ({
        category,
        items: items as Array<{
          description: string;
          quantity: number;
          unit: string;
          aiConfidence?: number;
        }>
      }));
    } catch (error) {
      // Error fetching inventory data
      return [];
    }
  };

  const fetchChecklistData = async (): Promise<ChecklistData[]> => {
    if (!currentHousehold) return [];

    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('household_id', currentHousehold.id);

      if (error) throw error;

      // Always return sample data for now since checklist_items table might not be populated
      const sampleHazards = ['Hurricane', 'Earthquake', 'Wildfire', 'Flood', 'Tornado', 'Heat Wave'];
      const result = sampleHazards.map(hazard => ({
        hazard,
        readinessPercentage: 0,
        items: [
          {
            category: 'Water & Food',
            name: 'Water (1 gallon per person per day)',
            needed: 3,
            unit: 'gallons',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Water & Food',
            name: 'Non-perishable food',
            needed: 3,
            unit: 'days',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Medical & First Aid',
            name: 'First aid kit',
            needed: 1,
            unit: 'kit',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Lighting & Power',
            name: 'Flashlight with batteries',
            needed: 1,
            unit: 'flashlight',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Communication',
            name: 'Battery-powered radio',
            needed: 1,
            unit: 'radio',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Tools & Safety',
            name: 'Emergency whistle',
            needed: 1,
            unit: 'whistle',
            have: 0,
            status: 'none' as const
          },
          {
            category: 'Important Documents',
            name: 'Important documents (IDs, insurance)',
            needed: 1,
            unit: 'set',
            have: 0,
            status: 'none' as const
          }
        ]
      }));

      return result;
    } catch (error) {
      // Error fetching checklist data
      // Return sample data if there's an error
      const fallbackData = [
        {
          hazard: 'Hurricane',
          readinessPercentage: 0,
          items: [
            {
              category: 'Water & Food',
              name: 'Water (1 gallon per person per day)',
              needed: 3,
              unit: 'gallons',
              have: 0,
              status: 'none' as const
            },
            {
              category: 'Water & Food',
              name: 'Non-perishable food',
              needed: 3,
              unit: 'days',
              have: 0,
              status: 'none' as const
            }
          ]
        }
      ];
      return fallbackData;
    }
  };

  const fetchPetsData = async () => {
    if (!currentHousehold) return [];

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('household_id', currentHousehold.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Error fetching pets data
      return [];
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

  const handleInviteMembers = async () => {
    if (!currentHousehold) {
      Alert.alert('Error', 'No household selected');
      return;
    }

    const inviteMessage = `🏠 Join my household "${currentHousehold.name}"!\n\nUse join code: ${currentHousehold.join_code}\n\nDownload Relief Ready app and use this code to join our emergency preparedness household.`;

    try {
      const result = await ShareAPI.share({
        message: inviteMessage,
        title: 'Join My Relief Ready Household',
      });

      if (result.action === ShareAPI.sharedAction) {
        if (result.activityType) {
          // Shared via activity type
          // Shared via activity type
        } else {
          // Shared successfully
          // Invite shared successfully
        }
      } else if (result.action === ShareAPI.dismissedAction) {
        // Dismissed
        // Share dismissed
      }
    } catch (error) {
      // Error sharing invite
      Alert.alert('Error', 'Failed to share invite. You can manually share the join code: ' + currentHousehold.join_code);
    }
  };

  const handleCreateHousehold = () => {
    router.push('/household-setup/create');
  };

  const handleJoinHousehold = () => {
    router.push('/household-setup/join');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. You will be removed from all households and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user) {
                Alert.alert('Error', 'No user found');
                return;
              }

              // Starting account deletion process

              // Step 1: Get the account ID first
              const { data: account } = await supabase
                .from('accounts')
                .select('id')
                .eq('user_id', user.id)
                .single();

              const accountId = account?.id;
              // Found account ID

              // Step 2: Delete all related data manually (since RPC functions may not exist)
              try {
                // First, get households where user is the only member
                let householdsToDelete = [];
                if (accountId) {
                  const { data: userMemberships } = await supabase
                    .from('memberships')
                    .select('household_id')
                    .eq('account_id', accountId);

                  if (userMemberships) {
                    for (const membership of userMemberships) {
                      // Check if this household has other members
                      const { data: otherMembers } = await supabase
                        .from('memberships')
                        .select('id')
                        .eq('household_id', membership.household_id)
                        .neq('account_id', accountId);

                      if (!otherMembers || otherMembers.length === 0) {
                        // User is the only member, mark household for deletion
                        householdsToDelete.push(membership.household_id);
                      }
                    }
                  }
                }

                // Households to delete (user is only member)

                // Delete household-related data for households being deleted
                for (const householdId of householdsToDelete) {
                  await supabase.from('checklist_items').delete().eq('household_id', householdId);
                  await supabase.from('inventory_items').delete().eq('household_id', householdId);
                  await supabase.from('members').delete().eq('household_id', householdId);
                  await supabase.from('pets').delete().eq('household_id', householdId);
                  await supabase.from('emergency_contacts').delete().eq('household_id', householdId);
                  await supabase.from('hazard_configs').delete().eq('household_id', householdId);
                  await supabase.from('donut_status').delete().eq('household_id', householdId);
                }

                if (accountId) {
                  await supabase.from('memberships').delete().eq('account_id', accountId);
                }

                for (const householdId of householdsToDelete) {
                  await supabase.from('households').delete().eq('id', householdId);
                }

                await supabase.from('chat_messages').delete().eq('user_id', user.id);
                await supabase.from('members').update({ claimed_by: null }).eq('claimed_by', user.id);
                await supabase.from('members').update({ created_by: null }).eq('created_by', user.id);
                await supabase.from('households').update({ created_by: null }).eq('created_by', user.id);

                if (accountId) {
                  await supabase.from('accounts').delete().eq('id', accountId);
                }

              } catch (cleanupError) {
                Alert.alert('Error', 'Failed to delete some account data. Please try again.');
                return;
              }

              // Sign out the user immediately since their account data is deleted
              await signOut();

              Alert.alert(
                'Account Deleted', 
                'Your account data has been successfully deleted. You have been signed out and your authentication will be removed shortly.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/auth/login');
                    },
                  },
                ]
              );
            } catch (error) {
              // Error deleting account
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSwitchHousehold = (householdId: string) => {
    selectHousehold(householdId);
  };

  const handleLeaveHousehold = () => {
    if (!currentHousehold || !user) return;

    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household? Your member profile will become available for others to claim.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the member profile linked to current user
              const { data: linkedMember, error: findError } = await supabase
                .from('members')
                .select('id')
                .eq('household_id', currentHousehold.id)
                .eq('claimed_by', user.id)
                .single();

              if (findError && findError.code !== 'PGRST116') {
                throw findError;
              }

              if (linkedMember) {
                // Unlink the member profile (set claimed_by to null)
                const { error: unlinkError } = await supabase
                  .from('members')
                  .update({ claimed_by: null })
                  .eq('id', linkedMember.id);

                if (unlinkError) throw unlinkError;
              }

              // Remove user's membership from the household
              const { error: membershipError } = await supabase
                .from('memberships')
                .delete()
                .eq('household_id', currentHousehold.id)
                .eq('account_id', (await supabase
                  .from('accounts')
                  .select('id')
                  .eq('user_id', user.id)
                  .single()).data?.id);

              if (membershipError) throw membershipError;

              // Clear current household selection immediately
              selectHousehold(null);
              
              // Refresh households to update the UI
              await refreshHouseholds();
              
              Alert.alert('Success', 'You have left the household successfully.');
            } catch (error: any) {
              // Error leaving household
              Alert.alert('Error', error.message || 'Failed to leave household');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = () => {
    if (!currentHousehold) return;

    Alert.alert(
      'Delete Household',
      'Are you sure you want to delete this household? This action cannot be undone and will remove all members and data associated with this household.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const householdId = currentHousehold.id;

              // Delete all members
              const { error: membersError } = await supabase
                .from('members')
                .delete()
                .eq('household_id', householdId);

              if (membersError) throw membersError;

              // Delete all pets
              const { error: petsError } = await supabase
                .from('pets')
                .delete()
                .eq('household_id', householdId);

              if (petsError) throw petsError;

              // Delete all memberships
              const { error: membershipsError } = await supabase
                .from('memberships')
                .delete()
                .eq('household_id', householdId);

              if (membershipsError) throw membershipsError;

              // Delete the household
              const { error: householdError } = await supabase
                .from('households')
                .delete()
                .eq('id', householdId);

              if (householdError) throw householdError;

              // Clear current household selection immediately
              selectHousehold(null);
              
              // Refresh households list
              await refreshHouseholds();

              // Check remaining households after refresh
              if (households.length > 1) {
                const nextHousehold = households.find(h => h.id !== householdId);
                if (nextHousehold) {
                  selectHousehold(nextHousehold.id);
                }
              } else {
                // If this was the only household, redirect to create new household
                router.push('/household-setup/create');
              }
            } catch (error) {
              // Error deleting household
              Alert.alert('Error', 'Failed to delete household');
            }
          },
        },
      ]
    );
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
              { text: 'Photo', onPress: handleImagePicker }
            ]
          )}
        >
          <View style={styles.userAvatar}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
            <Users size={32} color="#6B7280" />
            )}
            {isUploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleImagePicker}
            >
              <Camera size={16} color="#ffffff" />
            </TouchableOpacity>
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
                <>
              <Text style={styles.householdLocation}>
                {currentHousehold.zip_code}, {currentHousehold.country}
              </Text>
                  <Text style={styles.householdJoinCode}>
                    Join Code: {currentHousehold.join_code}
                  </Text>
                </>
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
      </View>

      {/* Members & Pets Section */}
      {currentHousehold && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members & Pets</Text>
          
          {/* Members Block */}
          <View style={styles.membersList}>
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
                    <View style={styles.memberAvatar}>
                      {(member as any).account?.photo_url ? (
                        <Image 
                          source={{ uri: (member as any).account.photo_url }} 
                          style={styles.memberProfileImage} 
                        />
                      ) : (
                        <Users size={20} color="#6B7280" />
                      )}
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {(member as any).account ? (
                          <View style={styles.linkedIndicator}>
                            <Check size={12} color="#059669" />
                            <Text style={styles.linkedText}>
                              {(member as any).isCurrentUser ? 'You' : 'Linked'}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.unlinkedIndicator}>
                            <Text style={styles.unlinkedText}>Available</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberAgeGroup}>
                        {member.age_group.charAt(0).toUpperCase() + member.age_group.slice(1)}
                      </Text>
                      {member.contact_info && (
                        <Text style={styles.memberDetail}>
                          📞 {formatPhoneNumber(member.contact_info)}
                        </Text>
                      )}
                      {member.medical_notes && (
                        <Text style={styles.memberDetail}>
                          🏥 {member.medical_notes}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.memberActionButton}
                        onPress={() => {
                          const nameParts = member.name.split(' ');
                          setEditingMember(member);
                          setMemberForm({
                            firstName: nameParts[0] || '',
                            lastName: nameParts.slice(1).join(' '),
                            ageGroup: member.age_group,
                            medicalNotes: member.medical_notes || '',
                            contactInfo: member.contact_info ? 
                              formatPhoneNumber(member.contact_info) : '',
                          });
                          setShowMemberModal(true);
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
                                    
                                    await fetchMembers();
                                    
                                    // Regenerate all checklists since household composition changed
                                    if (currentHousehold) {
                                      try {
                                        await generateAllChecklists(currentHousehold.id);
                                        // Checklists regenerated after member deletion
                                      } catch (checklistError) {
                                        // Failed to regenerate checklists
                                        // Don't fail the member deletion if checklist generation fails
                                      }
                                    }
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

          {/* Pets Block */}
          <View style={[styles.membersList, { marginTop: 16 }]}>
            <View style={styles.membersHeader}>
              <Text style={styles.membersTitle}>Pets</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setEditingPet(null);
                  setPetForm({
                    name: '',
                    type: 'Dog',
                    size: 'medium',
                    medicalNotes: '',
                  });
                  setShowPetModal(true);
                }}
              >
                <Plus size={20} color="#354eab" />
              </TouchableOpacity>
            </View>
            {loadingPets ? (
              <View style={styles.loadingMembersContainer}>
                <ActivityIndicator color={colors.buttonSecondary} />
              </View>
            ) : pets.length === 0 ? (
              <View style={styles.emptyMembersContainer}>
                <AlertCircle size={24} color="#6B7280" />
                <Text style={styles.emptyMembersText}>No pets added yet</Text>
              </View>
            ) : (
              <View>
                {pets.map((pet) => (
                  <View key={pet.id} style={styles.memberItem}>
                    <View style={styles.memberAvatar}>
                      <Text style={{ fontSize: 20 }}>🐾</Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <Text style={styles.memberName}>{pet.name}</Text>
                      </View>
                      <Text style={styles.memberAgeGroup}>
                        {pet.type} • {pet.size.charAt(0).toUpperCase() + pet.size.slice(1)}
                      </Text>
                      {pet.medical_notes && (
                        <Text style={styles.memberDetail}>
                          🏥 {pet.medical_notes}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        style={styles.memberActionButton}
                        onPress={() => {
                          setEditingPet(pet);
                          setPetForm({
                            name: pet.name,
                            type: pet.type,
                            size: pet.size as 'small' | 'medium' | 'large',
                            medicalNotes: pet.medical_notes || '',
                          });
                          setShowPetModal(true);
                        }}
                      >
                        <Edit3 size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.memberActionButton}
                        onPress={() => {
                          Alert.alert(
                            'Remove Pet',
                            'Are you sure you want to remove this pet?',
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
                                      .from('pets')
                                      .delete()
                                      .eq('id', pet.id);
                                    
                                    if (error) throw error;
                                    await fetchPets();
                                  } catch (error) {
                                    Alert.alert('Error', 'Failed to remove pet');
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
        </View>
      )}

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View>
              <Text style={styles.locationSubtitle}>
                {currentHousehold?.zip_code}, {currentHousehold?.country}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.mapPreview}
            onPress={() => router.push('/(tabs)/map')}
          >
            <View ref={mapRef} style={styles.mapPreview} collapsable={false}>
              {currentHousehold?.zip_code && currentHousehold.latitude && currentHousehold.longitude ? (
                <DisasterMap 
                  style={styles.mapPreview}
                  miniMap={true}
                  zipCode={currentHousehold.zip_code}
                />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapText}>No location set</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
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

          {currentHousehold && (
            <>
              <TouchableOpacity 
                style={[styles.actionItem, styles.leaveAction]} 
                onPress={handleLeaveHousehold}
              >
                <UserMinus size={20} color="#F59E0B" />
                <Text style={[styles.actionText, styles.leaveActionText]}>Leave Household</Text>
          </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionItem, styles.deleteAction]} 
                onPress={handleDeleteHousehold}
              >
                <X size={20} color="#EF4444" />
                <Text style={[styles.actionText, styles.deleteActionText]}>Delete This Household</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Options</Text>
        <View style={styles.menuList}>
          {currentHousehold && (
            <TouchableOpacity 
              style={[styles.menuItem, isGeneratingPDF && styles.menuItemDisabled]} 
              onPress={handleExportPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <ActivityIndicator size={20} color="#6B7280" />
              ) : (
                <FileText size={20} color="#6B7280" />
              )}
              <Text style={styles.menuText}>
                {isGeneratingPDF ? 'Generating PDF...' : 'Export to PDF'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={handleInviteMembers}>
            <Share size={20} color="#6B7280" />
            <Text style={styles.menuText}>Invite Members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/account/settings')}
          >
            <Settings size={20} color="#6B7280" />
            <Text style={styles.menuText}>Account Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleDeleteAccount}
          >
            <X size={20} color="#EF4444" />
            <Text style={[styles.menuText, styles.deleteText]}>Delete Account</Text>
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
                {['infant', 'child', 'teen', 'adult', 'senior'].map((age) => (
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
                      {age === 'infant' ? 'Infant (0-2)' :
                       age === 'child' ? 'Child (3-12)' :
                       age === 'teen' ? 'Teen (13-17)' :
                       age === 'adult' ? 'Adult (18-64)' :
                       'Senior (65+)'}
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
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setMemberForm(prev => ({ ...prev, contactInfo: formatted }));
                }}
                placeholder="(000) 000-0000"
                keyboardType="phone-pad"
                maxLength={14}
              />
            </View>


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
                    medical_notes: memberForm.medicalNotes || null,
                    contact_info: memberForm.contactInfo ? 
                      memberForm.contactInfo.replace(/\D/g, '') : null,
                  };

                  if (editingMember) {
                    // Update existing member
                    const { error: memberError } = await supabase
                      .from('members')
                      .update(memberData)
                      .eq('id', editingMember.id);

                    if (memberError) {
                      // Member update error
                      throw memberError;
                    }
                  } else {
                    // Create new member
                    const { error: memberError } = await supabase
                      .from('members')
                      .insert(memberData);

                    if (memberError) throw memberError;
                  }


                  await fetchMembers();
                  
                  // Regenerate all checklists since household composition changed
                  try {
                    await generateAllChecklists(currentHousehold.id);
                    // Checklists regenerated after member update
                  } catch (checklistError) {
                    // Failed to regenerate checklists
                    // Don't fail the member update if checklist generation fails
                  }
                  
                  setShowMemberModal(false);
                } catch (error) {
                  // Error saving member
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

      {/* Pet Modal */}
      <Modal
        visible={showPetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.memberModal, { maxHeight: '80%', borderRadius: 12 }]}>
          <View style={styles.memberModalHeader}>
            <Text style={styles.memberModalTitle}>
              {editingPet ? 'Edit Pet' : 'Add Pet'}
            </Text>
            <TouchableOpacity onPress={() => setShowPetModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.memberForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pet Name *</Text>
              <TextInput
                style={styles.formInput}
                value={petForm.name}
                onChangeText={(text) => setPetForm(prev => ({ ...prev, name: text }))}
                placeholder="Enter pet name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pet Type *</Text>
              <View style={styles.formSelect}>
                {PET_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectOption,
                      petForm.type === type && styles.selectOptionSelected
                    ]}
                    onPress={() => setPetForm(prev => ({ ...prev, type: type }))}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      petForm.type === type && styles.selectOptionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pet Size *</Text>
              <View style={styles.formSelect}>
                {['small', 'medium', 'large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.selectOption,
                      petForm.size === size && styles.selectOptionSelected
                    ]}
                    onPress={() => setPetForm(prev => ({ ...prev, size: size as typeof petForm.size }))}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      petForm.size === size && styles.selectOptionTextSelected
                    ]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Medical Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                value={petForm.medicalNotes}
                onChangeText={(text) => setPetForm(prev => ({ ...prev, medicalNotes: text }))}
                placeholder="Enter any special needs, allergies, or medical conditions"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!petForm.name || !petForm.type) && styles.submitButtonDisabled]}
              onPress={async () => {
                if (!currentHousehold) return;

                if (!petForm.name.trim()) {
                  Alert.alert('Error', 'Pet name is required');
                  return;
                }

                if (!petForm.type.trim()) {
                  Alert.alert('Error', 'Pet type is required');
                  return;
                }

                try {
                  const petData = {
                    household_id: currentHousehold.id,
                    name: petForm.name.trim(),
                    type: petForm.type.trim(),
                    size: petForm.size,
                    medical_notes: petForm.medicalNotes || null,
                  };

                  if (editingPet) {
                    // Update existing pet
                    const { error: petError } = await supabase
                      .from('pets')
                      .update(petData)
                      .eq('id', editingPet.id);

                    if (petError) {
                      // Pet update error
                      throw petError;
                    }
                  } else {
                    // Create new pet
                    const { error: petError } = await supabase
                      .from('pets')
                      .insert(petData);

                    if (petError) throw petError;
                  }

                  await fetchPets();
                  setShowPetModal(false);
                } catch (error) {
                  // Error saving pet
                  Alert.alert('Error', 'Failed to save pet information');
                }
              }}
            >
              <Text style={styles.submitButtonText}>Save Pet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPetModal(false)}
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
  leaveAction: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leaveActionText: {
    color: '#F59E0B',
  },
  deleteAction: {
    borderBottomWidth: 0,
  },
  deleteActionText: {
    color: '#EF4444',
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
    backgroundColor: colors.buttonPrimary,
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
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    flex: 1,
  },
  linkedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  linkedText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 2,
  },
  unlinkedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  unlinkedText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  memberAgeGroup: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberDetail: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
    lineHeight: 16,
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
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
    position: 'relative',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#354eab',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
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
  householdJoinCode: {
    fontSize: 12,
    color: '#354eab',
    fontWeight: '600',
    marginTop: 2,
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
  actionItemDisabled: {
    opacity: 0.6,
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
  menuItemDisabled: {
    opacity: 0.6,
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
  viewMapButton: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  viewMapButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    height: 200, // Changed from 120 to 200 for better 2:3 ratio
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
  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});