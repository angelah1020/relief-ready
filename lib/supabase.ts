import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          photo_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          photo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          photo_url?: string;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          country: string;
          zip_code: string;
          latitude?: number;
          longitude?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country: string;
          zip_code: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          country?: string;
          zip_code?: string;
          latitude?: number;
          longitude?: number;
          updated_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          account_id: string;
          household_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          household_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          role?: 'owner' | 'admin' | 'member';
        };
      };
      members: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          age_group: 'infant' | 'child' | 'teen' | 'adult' | 'senior';
          medical_notes?: string;
          contact_info?: string;
          is_pet: boolean;
          claimed_by?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          age_group: 'infant' | 'child' | 'teen' | 'adult' | 'senior';
          medical_notes?: string;
          contact_info?: string;
          is_pet?: boolean;
          claimed_by?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          age_group?: 'infant' | 'child' | 'teen' | 'adult' | 'senior';
          medical_notes?: string;
          contact_info?: string;
          is_pet?: boolean;
          claimed_by?: string;
        };
      };
      pets: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: string;
          size: 'small' | 'medium' | 'large';
          medical_notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: string;
          size: 'small' | 'medium' | 'large';
          medical_notes?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          size?: 'small' | 'medium' | 'large';
          medical_notes?: string;
        };
      };
      checklist_items: {
        Row: {
          id: string;
          household_id: string;
          category: string;
          item_key: string;
          description: string;
          quantity_needed: number;
          unit: string;
          priority: 'high' | 'medium' | 'low';
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category: string;
          item_key: string;
          description: string;
          quantity_needed: number;
          unit: string;
          priority: 'high' | 'medium' | 'low';
          created_at?: string;
        };
        Update: {
          description?: string;
          quantity_needed?: number;
          unit?: string;
          priority?: 'high' | 'medium' | 'low';
        };
      };
      inventory_items: {
        Row: {
          id: string;
          household_id: string;
          category: string;
          item_key: string;
          description: string;
          quantity: number;
          unit: string;
          expiration_date?: string;
          location?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category: string;
          item_key: string;
          description: string;
          quantity: number;
          unit: string;
          expiration_date?: string;
          location?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          item_key?: string;
          description?: string;
          quantity?: number;
          unit?: string;
          expiration_date?: string;
          location?: string;
          updated_at?: string;
        };
      };
      donut_status: {
        Row: {
          id: string;
          household_id: string;
          hazard_type: 'hurricane' | 'wildfire' | 'flood' | 'earthquake' | 'tornado' | 'heat';
          readiness_percentage: number;
          last_updated: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          hazard_type: 'hurricane' | 'wildfire' | 'flood' | 'earthquake' | 'tornado' | 'heat';
          readiness_percentage: number;
          last_updated?: string;
        };
        Update: {
          readiness_percentage?: number;
          last_updated?: string;
        };
      };
      nba_actions: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string;
          category: string;
          item_key?: string;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description: string;
          category: string;
          item_key?: string;
          priority: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: string;
          item_key?: string;
          priority?: number;
        };
      };
      invites: {
        Row: {
          id: string;
          household_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          used_by?: string;
          used_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          used_by?: string;
          used_at?: string;
          created_at?: string;
        };
        Update: {
          used_by?: string;
          used_at?: string;
        };
      };
    };
  };
}