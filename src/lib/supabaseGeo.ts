import { createClient } from '@supabase/supabase-js';

// Client Supabase externe pour les données géospatiales (PostGIS)
// Note: anon key is a publishable key, safe to include in client code
const supabaseUrl = 'https://anujltoavoafclklucdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzIyNTQsImV4cCI6MjA4MzcwODI1NH0.eRjOECx2G5_MrL2KvXWw4vRDnP-JEOYm_70VXkPf5AU';

export const supabaseGeo = createClient(supabaseUrl, supabaseAnonKey);

// Helper pour sync user entre Lovable et Supabase externe
export async function ensureUserInGeo(userId: string, username?: string) {
  try {
    const { error } = await supabaseGeo
      .from('user_profiles')
      .upsert(
        { 
          id: userId,
          username: username || 'Explorer',
          created_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
    
    if (error) {
      console.error('Error syncing user to geo DB:', error);
    }
  } catch (err) {
    console.error('Exception syncing user:', err);
  }
}
