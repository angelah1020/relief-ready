import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Tables } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { geocodeZipCode } from '@/lib/utils/geocoding';

interface HouseholdContextType {
  currentHousehold: Tables<'households'> | null;
  households: Tables<'households'>[];
  loading: boolean;
  selectHousehold: (householdId: string | null) => void;
  refreshHouseholds: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentHousehold, setCurrentHousehold] = useState<Tables<'households'> | null>(null);
  const [households, setHouseholds] = useState<Tables<'households'>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = async () => {
    if (!user) {
      setHouseholds([]);
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    try {
      // Get user's account
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, email, display_name')
        .eq('user_id', user.id)
        .single();

      let accountId = account?.id;

      // If no account found, create one (this should rarely happen with the trigger)
      if (!account) {
        
        try {
          const { data: newAccount, error: createError } = await supabase
            .from('accounts')
            .insert({
              user_id: user.id,
              email: user.email || '',
              display_name: user.email || 'User',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (newAccount) {
            accountId = newAccount.id;
          } else {
            setHouseholds([]);
            setLoading(false);
            return;
          }
        } catch (createError) {
          console.error('HouseholdContext: Error creating account:', createError);
          setHouseholds([]);
          setLoading(false);
          return;
        }
      }

      // Get households user is member of - try account_id first, then user_id as fallback
      let { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select(`
          household_id,
          households (*)
        `)
        .eq('account_id', accountId);

      // If no memberships found with account_id, try with user_id directly (legacy support)
      if (!memberships || memberships.length === 0) {
        const { data: directMemberships, error: directError } = await supabase
          .from('memberships')
          .select(`
            household_id,
            households (*)
          `)
          .eq('account_id', user.id);

        if (directMemberships && directMemberships.length > 0) {
          memberships = directMemberships;
          membershipError = directError;
        }
      }

      if (memberships) {
        const householdList = memberships.map(m => m.households).filter(Boolean) as unknown as Tables<'households'>[];
        
        // Geocode households that don't have coordinates
        const updatedHouseholds = await Promise.all(
          householdList.map(async (household) => {
            if (!household.latitude || !household.longitude) {
              try {
                const coordinates = await geocodeZipCode(household.zip_code, household.country);
                if (coordinates) {
                  // Update household with coordinates
                  const { data: updatedHousehold } = await supabase
                    .from('households')
                    .update({
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', household.id)
                    .select()
                    .single();
                  
                  return updatedHousehold || household;
                }
              } catch (error) {
                console.warn('Failed to geocode household:', error);
              }
            }
            return household;
          })
        );
        
        setHouseholds(updatedHouseholds);
        
        // Set first household as current if none selected
        if (!currentHousehold && updatedHouseholds.length > 0) {
          setCurrentHousehold(updatedHouseholds[0]);
        }
      } else {
        setHouseholds([]);
      }
    } catch (error) {
      console.error('Error fetching households:', error);
      setHouseholds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  const selectHousehold = (householdId: string | null) => {
    if (householdId === null) {
      setCurrentHousehold(null);
      return;
    }
    const household = households.find(h => h.id === householdId);
    if (household) {
      setCurrentHousehold(household);
    }
  };

  const refreshHouseholds = async () => {
    setLoading(true);
    await fetchHouseholds();
  };


  return (
    <HouseholdContext.Provider
      value={{
        currentHousehold,
        households,
        loading,
        selectHousehold,
        refreshHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}