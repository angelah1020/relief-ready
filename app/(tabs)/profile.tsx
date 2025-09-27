import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
  Check
} from 'lucide-react-native';

export default function HouseholdScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentHousehold, households, selectHousehold } = useHousehold();
  const [account, setAccount] = useState<Tables<'accounts'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccount();
    }
  }, [user]);

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
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Users size={32} color="#6B7280" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{account?.display_name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Current Household */}
      {currentHousehold && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Household</Text>
          <View style={[styles.householdCard, styles.currentHouseholdCard]}>
            <Home size={20} color="#354eab" />
            <View style={styles.householdInfo}>
              <Text style={styles.householdName}>{currentHousehold.name}</Text>
              <Text style={styles.householdLocation}>
                {currentHousehold.zip_code}, {currentHousehold.country}
              </Text>
            </View>
            <Check size={20} color="#059669" />
          </View>
        </View>
      )}

      {/* All Households */}
      {households.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Switch Household</Text>
          <View style={styles.householdList}>
            {households.map((household) => (
              <TouchableOpacity
                key={household.id}
                style={[
                  styles.householdItem,
                  currentHousehold?.id === household.id && { backgroundColor: colors.buttonSecondary + '22' }
                ]}
                onPress={() => handleSwitchHousehold(household.id)}
              >
                <Home size={20} color={currentHousehold?.id === household.id ? colors.buttonSecondary : "#6B7280"} />
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
        </View>
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});