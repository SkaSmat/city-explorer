import { createClient } from '@supabase/supabase-js';

// Client Supabase externe pour les données géospatiales (PostGIS)
// IMPORTANT: Ces clés doivent être dans les variables d'environnement (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL_GEO;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY_GEO;
const supabaseServiceKey = import.meta.env.VITE_EXTERNAL_SUPABASE_SERVICE_KEY;

// Validation des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ ERREUR CRITIQUE: Variables d\'environnement Supabase manquantes!\n' +
    'Vérifiez que VITE_SUPABASE_URL_GEO et VITE_SUPABASE_ANON_KEY_GEO sont définies dans .env'
  );
  throw new Error('Missing Supabase environment variables');
}

export const supabaseGeo = createClient(supabaseUrl, supabaseAnonKey);

// Client admin avec service_role (bypass RLS)
export const supabaseGeoAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseGeo;

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
