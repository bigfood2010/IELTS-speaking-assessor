import { createClient } from '@supabase/supabase-js';
import { getSupabaseClientKey, getSupabaseConfigError } from './supabaseConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = getSupabaseClientKey(import.meta.env);
export const supabaseConfigError = getSupabaseConfigError(supabaseUrl, supabaseAnonKey);

if (supabaseConfigError) {
  console.warn(supabaseConfigError);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});
