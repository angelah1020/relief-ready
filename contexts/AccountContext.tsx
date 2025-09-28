import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, Tables } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface AccountContextType {
  account: Tables<'accounts'> | null;
  loading: boolean;
  updateAccount: (updates: Partial<Tables<'accounts'>>) => Promise<{ error: any }>;
  refreshAccount: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [account, setAccount] = useState<Tables<'accounts'> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = async () => {
    if (!user) {
      setAccount(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Error fetching account
        setAccount(null);
      } else {
        setAccount(data);
      }
    } catch (error) {
      // Error fetching account
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (updates: Partial<Tables<'accounts'>>) => {
    if (!account) {
      return { error: { message: 'No account found' } };
    }

    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setAccount(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshAccount = async () => {
    setLoading(true);
    await fetchAccount();
  };

  useEffect(() => {
    fetchAccount();
  }, [user]);

  return (
    <AccountContext.Provider
      value={{
        account,
        loading,
        updateAccount,
        refreshAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
