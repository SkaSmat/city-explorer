import { createClient } from '@supabase/supabase-js';

// Client Supabase externe pour les données géospatiales
const supabaseUrl = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase external credentials');
}

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
