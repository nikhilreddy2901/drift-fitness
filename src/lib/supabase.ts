/**
 * DRIFT FITNESS - SUPABASE CLIENT
 * Cloud database and authentication
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxjxgcemkqbpyqvmlkpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4anhnY2Vta3FicHlxdm1sa3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzUzODUsImV4cCI6MjA4MDc1MTM4NX0.jn4HVPdGeNggS-hJF1LkQgFDj-GExicDgQFPXz8GKLM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
