import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Browser-safe standard client for RLS-protected operations.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
