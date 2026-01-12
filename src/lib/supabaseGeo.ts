import { createClient } from '@supabase/supabase-js';

// Client Supabase externe pour les données géospatiales (PostGIS)
// Ces clés sont publiques (anon key) et peuvent être dans le code
const SUPABASE_GEO_URL = 'https://anujltoavoafclklucdx.supabase.co';
const SUPABASE_GEO_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWpsdG9hdm9hZmNsa2x1Y2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzIyNTQsImV4cCI6MjA4MzcwODI1NH0.eRjOECx2G5_MrL2KvXWw4vRDnP-JEOYm_70VXkPf5AU';

// Client principal pour les opérations géospatiales
export const supabaseGeo = createClient(SUPABASE_GEO_URL, SUPABASE_GEO_ANON_KEY);

// Note: Le service_role key ne doit PAS être utilisé côté frontend
// Les opérations admin doivent passer par des edge functions
export const supabaseGeoAdmin = supabaseGeo;

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
