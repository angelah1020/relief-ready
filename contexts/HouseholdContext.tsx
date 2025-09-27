import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Tables } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { geocodeZipCode } from '@/lib/utils/geocoding';

interface HouseholdContextType {
  currentHousehold: Tables<'households'> | null;
  households: Tables<'households'>[];
  loading: boolean;
  selectHousehold: (householdId: string) => void;
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
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!account) {
        setLoading(false);
        return;
      }

      // Get households user is member of
      const { data: memberships } = await supabase
        .from('memberships')
        .select(`
          household_id,
          households (*)
        `)
        .eq('account_id', account.id);

      if (memberships) {
        const householdList = memberships.map(m => m.households).filter(Boolean) as Tables<'households'>[];
        
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
      }
    } catch (error) {
      console.error('Error fetching households:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [user]);

  const selectHousehold = (householdId: string) => {
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