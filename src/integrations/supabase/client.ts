// Supabase client configuration
// Uses external Supabase instance with PostGIS for geospatial data
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// External Supabase instance (PostGIS enabled)
// Hardcoded to avoid Vite environment variable issues
const SUPABASE_URL = "https://anujltoavoafclklucdx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzIyNTQsImV4cCI6MjA4MzcwODI1NH0.eRjOECx2G5_MrL2KvXWw4vRDnP-JEOYm_70VXkPf5AU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
