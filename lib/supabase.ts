import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// AsyncStorage accesses `window` on web; guard during SSR (expo-router static render).
const storage: SupportedStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
